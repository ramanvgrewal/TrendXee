package com.trendzy.business.contact;

import java.util.HashMap;
import java.util.Map;

/** Short-lived request counters; never log or persist visitor addresses. */
final class ContactRateLimit {
    private record Window(long started, int count) {}
    private final Map<String, Window> windows = new HashMap<>();
    private static final long WINDOW_MS = 15 * 60 * 1000;

    synchronized boolean allow(String address) {
        long now = System.currentTimeMillis();
        windows.entrySet().removeIf(entry -> now - entry.getValue().started() >= WINDOW_MS);
        Window window = windows.get(address);
        if (window == null && windows.size() >= 4096) return false;
        if (window != null && window.count() >= 5) return false;
        windows.put(address, new Window(window == null ? now : window.started(), window == null ? 1 : window.count() + 1));
        return true;
    }
}
