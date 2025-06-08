```mermaid
flowchart TD
    A[YouTube URL] -->|Extract| B[Video Transcript]
    B -->|Analyze| C[Topic Detection]
    C -->|Generate| D[Questions]
    D -->|Answer| E[ELI5 Answers]
    E -->|Format| F[Generate HTML]
    F -->|Optional| G[Convert to PDF]
    
    subgraph AI Providers
        P1[Google Gemini]
        P2[OpenAI]
        P3[Anthropic Claude]
        P4[LocalAI]
    end
    
    AI Providers -.->|Selected Provider| C
    AI Providers -.->|Selected Provider| D
    AI Providers -.->|Selected Provider| E
    
    subgraph Configuration
        C1[config.yml]
        C2[Environment Variables]
    end
    
    Configuration -.->|Settings| AI Providers
    
    style A fill:#ffcccb,stroke:#333,stroke-width:2px
    style B fill:#c2e0ff,stroke:#333,stroke-width:2px
    style C fill:#d4f7c9,stroke:#333,stroke-width:2px
    style D fill:#ffecb3,stroke:#333,stroke-width:2px
    style E fill:#e1bee7,stroke:#333,stroke-width:2px
    style F fill:#b2dfdb,stroke:#333,stroke-width:2px
    style G fill:#b2dfdb,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
```
