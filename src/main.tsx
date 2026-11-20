import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Clear every company query immediately when identity changes.
useAuthStore.subscribe((state, previous) => {
  if (state.tokens?.accessToken !== previous.tokens?.accessToken)
    queryClient.clear();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#4f46e5",
            borderRadius: 10,
            controlHeight: 40,
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          },
        }}
        form={{
          validateMessages: {
            required: "${label} is required",
            types: { email: "Enter a valid email address" },
            string: {
              min: "${label} must be at least ${min} characters",
              max: "${label} must be at most ${max} characters",
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
