// src/main/java/com/boot/eumbank/join/verification/store/VerifyCodeStore.java
package com.boot.eumbank.join.verification.store;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VerifyCodeStore {

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final Set<String> usedEmails = ConcurrentHashMap.newKeySet();
    private final long expireMinutes;

    public VerifyCodeStore(@Value("${app.email.verify.expire-minutes:15}") long expireMinutes) {
        this.expireMinutes = expireMinutes;
    }

    public void put(String email, String code) {
        String key = norm(email);
        if (usedEmails.contains(key)) throw new IllegalStateException("USED_EMAIL");
        store.put(key, new Entry(code, LocalDateTime.now().plusMinutes(expireMinutes)));
    }

    public boolean verify(String email, String code) {
        String key = norm(email);
        if (usedEmails.contains(key)) return false;
        Entry e = store.get(key);
        if (e == null) return false;
        if (e.expiresAt.isBefore(LocalDateTime.now())) {
            store.remove(key);
            return false;
        }
        boolean ok = e.code.equals(code);
        if (ok) {
            store.remove(key);
            usedEmails.add(key);
        }
        return ok;
    }

    private String norm(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private record Entry(String code, LocalDateTime expiresAt) {}
}
