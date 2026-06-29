# AI Tool Disclosure

In compliance with the integrity and transparency guidelines of this technical recruitment process, this document outlines the usage of artificial intelligence tools during the development lifecycle of this service.

## Tools Utilized
- Google Gemini (AI Collaborative Assistant)

## Scope of Assistance
- **Boilerplate & Directory Scaffolding:** Used to quickly map out the standard modular file layouts, Express middleware frameworks, and environment variable skeletons.
- **Resilience Engineering Brainstorming:** Used as a reference point to validate distributed system architectures, specifically mapping out edge-case failures for the Transactional Outbox and Saga designs.
- **Documentation Structuring:** Assisted in generating the initial Markdown formatting layouts for the engineering design files.

## Engineer Verification & Ownership
- Every line of code, route handler, and SQL instruction was reviewed, customized, and executed locally by the developer.
- The PostgreSQL transaction blocks, row-level exclusive locks (`FOR UPDATE`), and schema-level table constraints (`CHECK`) were explicitly validated against race conditions using a multi-threaded integration test script.
- All inline code comments and architectural explanations were heavily edited to ensure they accurately represent the actual implemented code without automated fluff.
