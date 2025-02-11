# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Automated Meeting Transcript Scraper and Backup with Fathom

**Objective:**  
Develop an AI-driven agent that logs into Fathom using Google credentials, navigates through meeting recordings to extract full transcripts and summaries, and then stores this data in a database (e.g., Supabase) for later vectorization and semantic querying.

**Target Users:**  
- Professionals using Fathom for meeting recordings who want to back up and analyze their transcripts.
- Teams seeking to integrate meeting insights into broader knowledge management systems.

---

## 2. Problem Statement

Fathom AI does not currently provide an open API to access meeting transcripts and summaries. Users need a reliable way to back up, analyze, and later search through their meeting data for relevant insights. The manual process is time-consuming and error-prone.

---

## 3. Objectives & Goals

- **Automation:**  
  Enable automatic login via Google OAuth and navigation within Fathom's UI to access meeting data.

- **Data Extraction:**  
  Scrape the complete transcript and summary for each meeting with high fidelity.

- **Data Storage:**  
  Securely store the extracted data in a structured database (e.g., Supabase) for future processing, vectorization, and querying.

- **Modularity & Extensibility:**  
  Build the solution in a modular fashion (using headless browsers, API wrappers, and storage services) so future enhancements—like semantic search or integration with other meeting tools—can be added easily.

---

## 4. Use Cases

- **Daily Backup:**  
  An automated process runs daily, logs into Fathom, and retrieves transcripts for all new meetings.

- **On-Demand Retrieval:**  
  A user triggers the process manually to retrieve transcripts from a specific meeting.

- **Integration with Analytics:**  
  Once data is stored, an AI agent later vectorizes the transcripts for semantic search, allowing users to ask natural language questions about past meetings.

---

## 5. Features

### Core Features

- **Authentication & Session Management:**
  - Use headless browser automation to simulate Google OAuth login.
  - Handle session persistence to avoid repeated logins and manage potential MFA or CAPTCHA challenges.

- **UI Navigation & Data Extraction:**
  - Automate navigation to the meeting dashboard and specific transcript pages.
  - Identify and scrape HTML elements that contain transcript text and summary details.
  - Robust error handling for changes in the UI layout.

- **Data Storage:**
  - Store extracted transcripts and metadata (meeting title, date, duration) in a Supabase PostgreSQL database.
  - Optionally store raw HTML snapshots for audit/logging purposes.

### Optional & Future Features

- **Vectorization & Semantic Search:**
  - Integrate with tools like LangChain to transform transcripts into vectors for AI querying.
  
- **RESTful API Layer:**
  - Build an API endpoint (using Express.js or FastAPI) that allows retrieval and update of meeting data.
  - Provide endpoints for manual triggering of transcript extraction.

- **UI for Monitoring:**
  - Develop a lightweight dashboard to monitor scraping status, logs, and errors.
  
- **Notification System:**
  - Alert users via email or messaging platforms if a scraping failure occurs or if new transcripts have been successfully added.

---

## 6. Technical Requirements

### Software Components

- **Headless Browser Automation:**  
  - **Primary Options:**  
    - **Puppeteer** or **Playwright** for navigating and scraping Fathom.
    - **browser-use** as an abstraction layer if needed.

- **Backend & API:**  
  - Node.js with Express or Python with FastAPI for building RESTful APIs.
  - Middleware for scheduling (e.g., using cron jobs or serverless functions).

- **Database:**  
  - **Supabase:** PostgreSQL-based database for storing transcripts and metadata.

### Integration Requirements

- **Google OAuth Handling:**  
  - Automate login flow, securely manage credentials, and store session cookies if possible.
  
- **Error Handling & Logging:**  
  - Implement robust error handling for network failures, UI changes, and authentication issues.
  - Log errors and events to a centralized logging system for debugging.

### Non-Functional Requirements

- **Performance:**  
  - The scraping process should complete within a reasonable time window (e.g., <5 minutes per session).
  
- **Security:**  
  - Securely handle user credentials and session data.
  - Ensure data stored in Supabase is encrypted and access-controlled.

- **Scalability:**  
  - Design the system to support an increasing number of meetings without significant performance degradation.

- **Maintainability:**  
  - Use modular, well-documented code to ease future enhancements and adjustments to Fathom UI changes.

---

## 7. Architecture & Workflow

1. **Authentication Module:**
   - Initiates headless browser session.
   - Automates the Google OAuth flow to log into Fathom.

2. **Scraper Module:**
   - Navigates to meeting dashboard.
   - Iterates over available meetings.
   - Extracts transcript and summary data using CSS selectors or DOM parsing.

3. **Storage Module:**
   - Processes scraped data.
   - Inserts transcripts, metadata, and optionally raw HTML into Supabase.

4. **API & Scheduler:**
   - Exposes endpoints for manual and automated triggering.
   - Schedules daily runs via cron jobs or a serverless function.

5. **Error & Logging Module:**
   - Logs activities and errors.
   - Provides feedback for debugging and operational monitoring.

---

## 8. Security Considerations

- **OAuth and Credential Management:**  
  - Ensure secure handling of Google login credentials.
  - Use environment variables and secret management tools to store sensitive information.

- **Data Privacy:**  
  - Comply with any data privacy requirements regarding meeting content.
  - Encrypt data both in transit and at rest.

- **Access Control:**  
  - Implement role-based access for the API endpoints and database operations.

---

## 9. Testing & QA

- **Unit Testing:**  
  - Write tests for each module (authentication, scraping, storage).
  
- **Integration Testing:**  
  - Simulate complete flows from login to data storage.
  
- **UI & Selector Testing:**  
  - Regularly validate that the scraping selectors are still valid given Fathom's UI changes.

- **Security Testing:**  
  - Conduct vulnerability scans on the automated login process and data storage endpoints.

---

## 10. Risks & Mitigations

- **UI Changes by Fathom:**  
  - **Risk:** Changes in Fathom's UI could break scraping.  
  - **Mitigation:** Use robust selectors, implement monitoring, and have a quick-fix process in place.

- **Google Login Challenges:**  
  - **Risk:** Automated login may trigger CAPTCHA or MFA.  
  - **Mitigation:** Use session persistence, consider headless browser plugins, and plan for manual intervention if necessary.

- **Data Security:**  
  - **Risk:** Exposure of sensitive meeting content.  
  - **Mitigation:** Enforce strict access controls, secure storage practices, and regular security audits.

---

## 11. Future Enhancements

- **Enhanced Data Analytics:**  
  - Integrate with machine learning models for sentiment analysis or topic extraction.

- **Multi-Platform Support:**  
  - Extend support to additional meeting platforms beyond Fathom.

- **User Interface:**  
  - Build a user dashboard for real-time monitoring and manual data correction.

- **Real-Time Notifications:**  
  - Implement push notifications or email alerts for new transcript availability or scraping issues.

---

## 12. Implementation Status (as of v0.1.1)

### Completed Features
- Basic project structure with TypeScript and Playwright
- Initial Supabase integration for data storage
- Environment variable configuration
- Manual login flow implementation
- Reliable transcript and summary extraction system:
  - Intelligent clipboard content verification
  - Content-based validation with minimum length checks (1000 chars for transcript, 100 for summary)
  - Progressive polling with retry mechanism
  - Enhanced error handling
  - Validation to ensure summary and transcript content are distinct
- Optimized performance:
  - Removed unnecessary wait times
  - Added content-based verification
  - Improved transcript and summary formatting with clear section separation
  - Added clear section headers for meeting information, summary, and transcript
  - Comprehensive logging system

### Pending Core Features
- Google OAuth automation (currently using manual login with timeout)
- Meeting dashboard navigation and iteration
- Session persistence
- Raw HTML snapshot storage
- Comprehensive error handling for remaining operations
- Logging system for non-transcript operations
- Batch processing for multiple videos

### Next Steps
1. Implement Google OAuth automation
2. Add meeting dashboard navigation
3. Implement session persistence
4. Add comprehensive error handling for remaining operations
5. Set up automated testing
6. Add logging system for non-transcript operations
7. Implement batch processing for multiple videos

---

This PRD should serve as a robust foundation for starting your project test on Cursor. It outlines the essential features, technical architecture, and potential risks while providing a clear roadmap for development.