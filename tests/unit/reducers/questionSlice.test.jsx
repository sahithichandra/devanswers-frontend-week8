import { describe, it, expect } from "vitest";
import questionReducer, {
  fetchQuestions,
  postQuestion,
} from "../../../src/reducers/questionSlice.js";

describe("questionSlice reducer", () => {
  it("returns initial state", () => {
    const state = questionReducer(undefined, { type: "unknown" });

    expect(state).toEqual({
      questions: [],
      currentQuestion: null,
      loading: false,
      error: null,
    });
  });

  it("handles fetchQuestions pending", () => {
    const action = fetchQuestions.pending("req-1", undefined);
    const state = questionReducer(undefined, action);

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("handles fetchQuestions fulfilled", () => {
    const questions = [{ _id: "q-1", title: "Question 1", voteCount: 0 }];
    const action = fetchQuestions.fulfilled(questions, "req-1", undefined);
    const state = questionReducer(undefined, action);

    expect(state.loading).toBe(false);
    expect(state.questions).toEqual(questions);
  });

  it("handles fetchQuestions rejected", () => {
    const action = fetchQuestions.rejected(
      null,
      "req-1",
      undefined,
      "Failed to fetch questions",
    );
    const state = questionReducer(undefined, action);

    expect(state.loading).toBe(false);
    expect(state.error).toBe("Failed to fetch questions");
  });

  it("handles postQuestion pending", () => {
    const action = postQuestion.pending("req-2", {
      title: "New title",
      description: "New description",
      tags: "react",
    });
    const state = questionReducer(undefined, action);

    expect(state.loading).toBe(true);
  });

  it("handles postQuestion fulfilled", () => {
    const initialState = {
      questions: [{ _id: "q-1", title: "Old", voteCount: 0 }],
      currentQuestion: null,
      loading: true,
      error: null,
    };
    const createdQuestion = {
      _id: "q-2",
      title: "Created",
      description: "Body",
      voteCount: 0,
      answers: [],
    };

    const action = postQuestion.fulfilled(createdQuestion, "req-2", {
      title: "Created",
      description: "Body",
      tags: "react",
    });
    const state = questionReducer(initialState, action);

    expect(state.loading).toBe(false);
    expect(state.questions).toHaveLength(2);
    expect(state.questions[1]).toEqual(createdQuestion);
    expect(state.currentQuestion).toEqual(createdQuestion);
  });

  it("handles postQuestion rejected", () => {
    const action = postQuestion.rejected(
      null,
      "req-2",
      { title: "Created", description: "Body", tags: "react" },
      "Failed to post question",
    );
    const state = questionReducer(undefined, action);

    expect(state.loading).toBe(false);
    expect(state.error).toBe("Failed to post question");
  });
});
