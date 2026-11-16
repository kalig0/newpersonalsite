# Daniel Yu
**Software Engineer | Machine Learning Engineer**

talldanielyu@gmail.com | (650) 278-0824 | danielyu.app | [linkedin.com/in/itsyangyu](https://linkedin.com/in/itsyangyu) | [github.com/kalig0](https://github.com/kalig0)

---

## Experience

### eGain — Sunnyvale, CA
**Software Development Engineer**
Jan 2025 – Present

**Voice AI and Genesys telephony integration**

- Designed and implemented a real-time conversational voice-agent system connecting phone calls through Genesys to a streaming AI runtime, knowledge retrieval, and speech generation.
- Built Genesys connectivity for call-session lifecycle management, media-protocol handling, connection validation, control messages, playback notifications, and operational logging.
- Implemented bidirectional audio streaming with audio-format conversion, interruption and barge-in handling, connection recovery, and isolated per-call state.
- Created a reusable Python voice runtime for configuration loading, call coordination, typed state, tool registration, intent processing, retrieval, speech generation, and resource cleanup.
- Implemented intent-aware voice orchestration for knowledge retrieval, follow-up questions, and customer-support interactions, with safeguards against using unvalidated information in generated responses.
- Built latency-management features including status acknowledgments matching the agent’s voice, cumulative turn timing, interruption-aware cancellation, and graceful timeout recovery.
- Added automated tests covering voice configuration, orchestration, retrieval, intent validation, latency management, audio protocols, WebSocket lifecycle, frontend behavior, and failure recovery.
- Containerized the voice service and integrated it into AWS deployment workflows with health checks, access controls, secrets management, centralized logging, and environment-specific configuration.
- Developed a supporting browser voice client with microphone capture, audio playback, connection controls, real-time audio visualization, tool-execution states, and WebSocket connection recovery.

**Workflow authoring and execution**

- Owned full-stack AI workflow automation features from requirements through release, building React/TypeScript authoring interfaces, Python/Pydantic APIs, OpenAPI contracts, and DynamoDB-backed data models.
- Developed visual workflow authoring capabilities for typed variables, question and statement nodes, external API actions, query filters, conditional branching, escalation, and transitions between workflows and AI agents.
- Implemented workflow draft and publication lifecycles, version history, read-only previews, publish-time validation, and node-reference validation while maintaining compatibility with legacy workflow records.
- Built session-context propagation across pre-chat workflows, customer-facing widgets, WebSocket services, and conversational AI pipelines.
- Improved workflow execution through variable normalization, conversation-history handling, execution recovery, message ordering, loop prevention, and human/AI handoffs.
- Defined typed API contracts and persistence models for workflow definitions, execution state, node configuration, metadata, and versioned records.
- Added unit tests covering workflow models, runtime behavior, API validation, persistence, publication checks, and frontend authoring components.

**RAG and conversational AI**

- Developed and maintained multiple conversational AI runtime implementations, preserving consistent retrieval, intent processing, session state, conversation history, and workflow-handoff behavior.
- Implemented retrieval-augmented generation pipelines using embeddings, semantic and hybrid search, OpenSearch, reranking, certified-answer flows, metadata filters, and structured conversation context.
- Improved multilingual knowledge routing, prompt orchestration, article-metadata preservation, retrieval tracing, and knowledge-source filtering.
- Built intent-aware conversation behavior with active-intent persistence, sub-intent processing, context enrichment, and safeguards against repeated workflow activation.

**Customer and contact-center messaging**

- Enhanced customer and contact-center messaging experiences through authentication, theming, pre-chat workflows, portal-context integration, WebSocket messaging, user-context propagation, and localization.

**Cloud infrastructure, delivery, and security**

- Designed and maintained AWS services and infrastructure using DynamoDB, OpenSearch, S3, SQS, CloudFront, IAM, containerized workloads, AWS SAM, and Terraform.
- Developed GitHub Actions and Docker/ECR release workflows supporting semantic versioning, automated build artifacts, environment-specific deployments, and reusable stack operations.
- Implemented authentication controls, API audit logging, request validation, signed file delivery, secrets handling, dependency remediation, and operational security improvements.
- Contributed to security and compliance processes through Fortify and FOSSA scans, automated vulnerability remediation, and compliance-aligned CI/CD controls.

### CVTE — Guangzhou, China
**Machine Learning Engineer Intern**
May 2024 – July 2024

- Developed and implemented logic enhancements for a machine learning model utilized in over 5 million classrooms, improving the generated classroom analysis by 20%
- Used Python, Matplotlib, and Pyplot to process classroom data to analyze and identify dips in classroom engagement
- Collaborated in an Agile/Scrum team of 8 engineers to deliver new large language model implementations every 2 weeks

### ReadMKT — San Francisco, CA
**Software Engineer**
Aug 2022 – Aug 2023

- Led development of a rich text editor using JavaScript, allowing users to intuitively edit content, embed media, and format text in a WYSIWYG environment
- Implemented infinite scrolling with lazy loading, enhancing the user experience and improving page performance

### 7G BioVentures — San Francisco, CA
**Full Stack Developer Intern**
May 2022 – Aug 2022

- Built a responsive internal dashboard using React, enabling employees to track and manage investment projects
- Created modular front-end components with reusable design patterns for scalable UI architecture

---

## Education

**Worcester Polytechnic Institute** — MS in Computer Science, Worcester, MA
*Aug 2023 – May 2025*
- Fine-tuned LLMs and built RAG pipeline for educational feedback, improving teacher response quality by 30%

**University of California, Santa Barbara** — BS in Mathematical Sciences, Santa Barbara, CA
*Aug 2018 – June 2022*

---

## Projects

### ASSISTments
*Jan 2023 – Present*

- Fine-tuned large language models using QLoRA to enhance the accuracy of feedback for student responses to math questions
- Trained models using TensorFlow on millions of student response data to develop and implement effective improvement strategies for student feedback
- Implemented vector database using FAISS to generate feedback and scores for student responses with retrieval augmented generation, improving large language model generated content accuracy by 30%

---

## Skills

- **Languages:** Python, TypeScript, C++, HTML, CSS
- **Frameworks:** PyTorch, TensorFlow, React, Node.js
- **Infrastructure:** AWS