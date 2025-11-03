package com.boot.eumbank.chat.controller;

import com.boot.eumbank.chat.dto.ChatRequest;
import com.boot.eumbank.chat.dto.ChatResponse;
import com.boot.eumbank.chat.service.ClaudeChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @Autowired
    private ClaudeChatService chatService;
    
    @PostMapping("/geminiChat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String reply = chatService.chat(request);
        return ResponseEntity.ok(new ChatResponse(reply));
    }

}