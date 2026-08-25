# StudyMate AI

Build a modern, responsive web application called JITA — an AI Study Assistant designed specifically to help university students stay organized, understand their coursework, and communicate professionally, all in one place.

This must be a fully functional, real-time working app, not a demo or static mockup. Use Supabase Edge Functions as the backend to securely call an AI model (API key kept server-side, never exposed in the frontend). Every tool below must send the user's actual input to the AI and return a real, dynamically generated response — no hardcoded or placeholder outputs anywhere.

The application should include the following 5 features:

1. Smart Academic Email Generator

   - Students generate professional emails to lecturers, tutors, or academic administration (e.g. requesting an extension, following up on a grade query, asking for a reference letter)

   - Support 3 tone options: Formal, Polite & Direct, Persuasive (for appeals/extensions)

   - Input: recipient context, purpose, key details. On "Generate," call the AI backend and display a real, complete, editable email with subject line

2. Lecture Notes Summarizer

   - Students paste raw or messy lecture notes / transcripts

   - On submit, call the AI backend and return: a clean summary, a bullet list of key concepts, and a separate list of action items (assignments, readings, deadlines mentioned in the notes)

   - Output must be structured and scannable, generated from the actual pasted text

3. AI Study Planner

   - Students input upcoming deadlines, exams, and available study hours per day

   - On submit, call the AI backend and generate a real prioritized daily/weekly study schedule, weighting by urgency (exams and near-term deadlines ranked higher than long-term coursework)

   - Output displayed as a clear day-by-day breakdown based on that specific input

4. AI Research Assistant

   - Students input a topic, question, or article text

   - On submit, call the AI backend and return a real plain-language summary, key points, and 2-3 suggested follow-up questions generated from that specific input

   - Frame this tool as a study aid for understanding topics, not for generating assignment content — reinforce this with UI copy

5. AI Study Buddy Chatbot

   - A live conversational interface connected to the AI backend, responding in real time to whatever the student types

   - Keep conversation context within the session

   - Supportive, encouraging tone suited to students who may be stressed or stuck

   - Frame this as a tool for understanding, not for producing final assignment answers

Structural Requirements:

- Dashboard layout with a sidebar navigation menu (one item per feature, plus a home/overview page)

- Each tool follows a consistent pattern: clear input section → "Generate" action → editable output section where students can tweak the AI response before copying or saving it

- Add a loading state (spinner or "Generating...") while waiting for the AI response on every tool

- Add error handling so if the AI call fails, the user sees a clear message and can retry

- Fully responsive design — must work well on both mobile and desktop

- Clean, modern, professional UI/UX similar to a SaaS platform — approachable and student-friendly rather than corporate

- Include a visible "Responsible AI Use" disclaimer, especially on the Research Assistant and Study Buddy Chatbot tools, reminding students that AI output is meant to support their learning and should not replace their own academic work, and to check their institution's academic integrity policy on AI use

Design style: clean, modern, professional, with a calm and encouraging feel appropriate for a student productivity tool. Use a simple, consistent color scheme and clear typography suited to a dashboard-style app.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://syllabus-support-bot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2dbe3f2c-7d85-46e7-8918-a1542295e5ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
