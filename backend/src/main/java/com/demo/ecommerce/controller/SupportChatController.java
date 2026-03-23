package com.demo.ecommerce.controller;

import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "http://localhost:5173")
public class SupportChatController {

    private static final Logger log = LoggerFactory.getLogger(SupportChatController.class);

    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").trim();
        log.info("Support chat message received: length={} chars", message.length());
        Sentry.logger().info("Support chat message received: length=%d chars", message.length());
        SseEmitter emitter = new SseEmitter(120_000L); // 2 min timeout

        executor.submit(() -> {
            try {
                // Locate the Python agent script relative to this project
                String projectRoot = Paths.get("").toAbsolutePath().toString()
                    .replaceAll("/backend$", "");
                String agentDir  = projectRoot + "/customer-support-agent";
                String python    = agentDir + "/venv/bin/python3";
                String agentScript = agentDir + "/agent_sse.py";

                ProcessBuilder pb = new ProcessBuilder(
                    List.of(python, agentScript, message)
                );
                pb.directory(Paths.get(agentDir).toFile());
                pb.redirectErrorStream(false);

                // Pass env file variables to subprocess
                pb.environment().put("PYTHONUNBUFFERED", "1");

                // Load .env file values
                java.io.File envFile = new java.io.File(agentDir + "/.env");
                if (envFile.exists()) {
                    try (var reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            line = line.trim();
                            if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                                int idx = line.indexOf('=');
                                String key = line.substring(0, idx).trim();
                                String val = line.substring(idx + 1).trim();
                                pb.environment().put(key, val);
                            }
                        }
                    }
                }

                Process process = pb.start();

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data: ")) {
                            emitter.send(SseEmitter.event().data(line.substring(6)));
                        }
                    }
                }

                int exitCode = process.waitFor();
                log.info("Support agent process completed: exitCode={}", exitCode);
                Sentry.logger().info("Support agent process completed: exitCode=%d", exitCode);
                emitter.complete();

            } catch (Exception e) {
                log.error("Support agent error: {}", e.getMessage(), e);
                Sentry.logger().error("Support agent error: %s", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().data(
                        "{\"type\":\"error\",\"message\":\"Agent error: " +
                        e.getMessage().replace("\"", "'") + "\"}"
                    ));
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }
}
