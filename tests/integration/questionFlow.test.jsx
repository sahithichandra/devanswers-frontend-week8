import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

import questionReducer, {
  fetchQuestions,
  fetchQuestionById,
  postQuestion,
  voteQuestion,
} from "../../src/reducers/questionSlice.js";

const userReducer = (
  state = {
    userInfo: {
      token: "mock-jwt-token-alice",
      userId: "user-1",
      name: "Alice Johnson",
    },
    login: { status: "idle", error: null },
    registration: { status: "idle", error: null },
  },
) => state;

const themeReducer = (state = { isDarkMode: false }) => state;

const createTestStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      question: questionReducer,
      theme: themeReducer,
    },
    preloadedState: {
      user: {
        userInfo: {
          token: "mock-jwt-token-alice",
          userId: "user-1",
          name: "Alice Johnson",
        },
        login: { status: "idle", error: null },
        registration: { status: "idle", error: null },
      },
    },
  });
};

describe("question thunk integration flow", () => {
  it("fetchQuestions populates question list", async () => {
    const store = createTestStore();

    const result = await store.dispatch(fetchQuestions());
    expect(fetchQuestions.fulfilled.match(result)).toBe(true);

    const state = store.getState().question;
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.questions.length).toBeGreaterThan(0);
  });

  it("fetchQuestionById sets currentQuestion", async () => {
    const store = createTestStore();

    const result = await store.dispatch(fetchQuestionById("question-1"));
    expect(fetchQuestionById.fulfilled.match(result)).toBe(true);

    const state = store.getState().question;
    expect(state.currentQuestion).not.toBeNull();
    expect(state.currentQuestion._id).toBe("question-1");
  });

  it("postQuestion creates and stores a new question", async () => {
    const store = createTestStore();

    const result = await store.dispatch(
      postQuestion({
        title: "How do I test Redux thunks?",
        description: "Looking for a clean testing strategy with MSW.",
        tags: "redux,testing,msw",
      }),
    );

    expect(postQuestion.fulfilled.match(result)).toBe(true);

    const state = store.getState().question;
    expect(state.currentQuestion).not.toBeNull();
    expect(state.currentQuestion.title).toBe("How do I test Redux thunks?");
    expect(state.questions[state.questions.length - 1]._id).toBe(
      state.currentQuestion._id,
    );
  });

  it("voteQuestion updates voteCount for the matching question", async () => {
    const store = createTestStore();

    await store.dispatch(fetchQuestions());
    const before = store
      .getState()
      .question.questions.find((q) => q._id === "question-1");

    const result = await store.dispatch(
      voteQuestion({ question: before, voteType: "upvote" }),
    );
    expect(voteQuestion.fulfilled.match(result)).toBe(true);

    const after = store
      .getState()
      .question.questions.find((q) => q._id === "question-1");
    expect(after.voteCount).toBe(before.voteCount + 1);
  });
});
