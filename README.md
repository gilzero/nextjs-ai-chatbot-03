# Anesthesia AI Assistant

<p align="center">
  <img alt="AI assistant for anesthesiology professionals." src="app/(chat)/opengraph-image.png">
</p>

<p align="center">
  An Open-Source AI Chatbot Template for Anesthesiology Professionals, built with Next.js 14, the App Router, and the Vercel AI SDK.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a> ·
  <a href="#acknowledgements"><strong>Acknowledgements</strong></a> ·
  <a href="#customized-by-weiming-medical-and-dreamer-ai"><strong>Customized by Weiming Medical and Dreamer AI</strong></a>
</p>

<br/>

## ⚕️ Purpose

This application is designed to be a powerful AI assistant for anesthesiology professionals. It provides a platform to access information, generate reports, and perform tasks related to anesthesia protocols, drug information, and safety measures.

## ✨ Key Features

*   **AI-Powered Chat for Anesthesiology:**
    *   Engage in natural language conversations with an AI assistant specialized in anesthesiology.
    *   Get quick answers to your questions about protocols, drug dosages, and safety measures.
*   **Next.js 14 & App Router:**
    *   Built with the latest Next.js features for optimal performance and routing.
    *   Utilizes React Server Components (RSCs) and Server Actions for enhanced server-side rendering and data handling.
*   **Vercel AI SDK:**
    *   Seamless integration with various LLMs, including OpenAI, Anthropic, Google, and Perplexity.
    *   Hooks for building dynamic chat interfaces.
*   **shadcn/ui:**
    *   Beautiful and accessible UI components built with Tailwind CSS.
    *   Component primitives from Radix UI for flexibility and accessibility.
*   **Data Persistence:**
    *   Uses Vercel Postgres (powered by Neon) for storing chat history and user data.
    *   Utilizes Vercel Blob for efficient file storage.
*   **NextAuth.js:**
    *   Simple and secure authentication for user management.
*   **Real-time Streaming:**
    *   Provides a smooth, real-time chat experience using server-sent events (SSE).
*   **Code Execution:**
    *   Includes a built-in code editor with Python support, powered by Pyodide, for testing and running code snippets.
*   **Document Management:**
    *   Create, edit, and manage text-based or code-based documents within the chat interface.
    *   Track changes to documents and revert to previous versions.
*   **Customizable UI:**
    *   Easily customizable with Tailwind CSS and shadcn/ui components.
*   **Suggested Actions:**
    *   Quickly access common anesthesiology-related queries through a set of suggested actions.

## 🤖 Model Providers

This template defaults to OpenAI's `gpt-4o` model, but you can easily switch to other providers using the Vercel AI SDK:

*   [OpenAI](https://openai.com)
*   [Anthropic](https://anthropic.com)
*   [Google](https://ai.google.dev/)
*   [Perplexity](https://www.perplexity.ai/)
*   And many more! (See the [AI SDK documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for a full list)

## 🚀 Deploy Your Own

Deploy your own Anesthesia AI Assistant to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## 💻 Running Locally

To run the Anesthesia AI Assistant locally, you'll need to set up the environment variables defined in `.env.example`. It's recommended to use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables), but a `.env` file will also work.

> **Important:** Do not commit your `.env` file, as it contains sensitive API keys and secrets.

Here's how to get started:

1.  **Install Vercel CLI:** `npm i -g vercel`
2.  **Link Local Instance:** `vercel link` (This creates a `.vercel` directory)
3.  **Download Environment Variables:** `vercel env pull`
4.  **Install Dependencies:** `pnpm install`
5.  **Start the Development Server:** `pnpm dev`

Your app should now be running at [http://localhost:3000](http://localhost:3000/).

We hope this template helps you build powerful AI tools for the medical field!

## Acknowledgements

This project is built with the help of the following resources:

-   [Vercel AI SDK](https://sdk.vercel.ai/)
-   [shadcn/ui](https://ui.shadcn.com/)
-   [Next.js 14](https://nextjs.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [Radix UI](https://radix-ui.com/)
-   [Google](https://ai.google.dev/)
-   [Anthropic](https://anthropic.com)
-   [OpenAI](https://openai.com)

## 🤖 Customized by Weiming Medical and Dreamer AI

This project is customized by Weiming Medical and Dreamer AI.

Weiming Medical is a medical robotics company that specializes in medical care.

Dreamer AI is a software company that specializes in AI and machine learning.
