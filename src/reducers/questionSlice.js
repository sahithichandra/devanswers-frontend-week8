import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  upvoteQuestion,
  downvoteQuestion,
  createAnswerForQuestion,
} from "../services/questionService.js";
import { upvoteAnswer, downvoteAnswer } from "../services/answerService.js";

const initialState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
};

export const fetchQuestions = createAsyncThunk(
  "question/fetchQuestions",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllQuestions();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch questions",
      );
    }
  },
);

export const fetchQuestionById = createAsyncThunk(
  "question/fetchQuestionById",
  async (id, { rejectWithValue }) => {
    try {
      return await getQuestionById(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch question",
      );
    }
  },
);

export const postQuestion = createAsyncThunk(
  "question/postQuestion",
  async ({ title, description, tags }, { rejectWithValue, getState }) => {
    try {
      const userInfo = getState().user.userInfo;
      const questionData = {
        title,
        description,
        tags,
        author: userInfo.userId,
      };
      return await createQuestion(questionData, userInfo.token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to post question",
      );
    }
  },
);

export const voteQuestion = createAsyncThunk(
  "question/voteQuestion",
  async ({ question, voteType }, { rejectWithValue, getState }) => {
    try {
      const token = getState().user.userInfo?.token;
      if (voteType === "upvote") {
        return await upvoteQuestion(question._id, token);
      }
      return await downvoteQuestion(question._id, token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to vote question",
      );
    }
  },
);

export const voteAnswer = createAsyncThunk(
  "question/voteAnswer",
  async ({ answer, voteType }, { rejectWithValue, getState }) => {
    try {
      const token = getState().user.userInfo?.token;
      if (voteType === "upvote") {
        return await upvoteAnswer(answer._id, token);
      }
      return await downvoteAnswer(answer._id, token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to vote answer",
      );
    }
  },
);

export const postAnswer = createAsyncThunk(
  "question/postAnswer",
  async ({ questionId, answerText }, { rejectWithValue, getState }) => {
    try {
      const userInfo = getState().user.userInfo;
      return await createAnswerForQuestion(questionId, answerText, userInfo.token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to post answer",
      );
    }
  },
);

const questionSlice = createSlice({
  name: "question",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchQuestionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(postQuestion.pending, (state) => {
        state.loading = true;
      })
      .addCase(postQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions.push(action.payload);
        state.currentQuestion = action.payload;
      })
      .addCase(postQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(voteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const updatedQuestion = action.payload;

        const questionIndex = state.questions.findIndex(
          (q) => q._id === updatedQuestion._id,
        );
        if (questionIndex !== -1) {
          state.questions[questionIndex].upvotes = updatedQuestion.upvotes;
          state.questions[questionIndex].downvotes = updatedQuestion.downvotes;
          state.questions[questionIndex].voteCount = updatedQuestion.voteCount;
        }

        if (state.currentQuestion?._id === updatedQuestion._id) {
          state.currentQuestion.upvotes = updatedQuestion.upvotes;
          state.currentQuestion.downvotes = updatedQuestion.downvotes;
          state.currentQuestion.voteCount = updatedQuestion.voteCount;
        }
      })
      .addCase(voteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(voteAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voteAnswer.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAnswer = action.payload;

        if (state.currentQuestion?.answers?.length) {
          const answerIndex = state.currentQuestion.answers.findIndex(
            (a) => a._id === updatedAnswer._id,
          );

          if (answerIndex !== -1) {
            state.currentQuestion.answers[answerIndex].upvotes = updatedAnswer.upvotes;
            state.currentQuestion.answers[answerIndex].downvotes =
              updatedAnswer.downvotes;
            state.currentQuestion.answers[answerIndex].voteCount = updatedAnswer.voteCount;
          }
        }
      })
      .addCase(voteAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(postAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postAnswer.fulfilled, (state, action) => {
        state.loading = false;

        if (state.currentQuestion) {
          if (!Array.isArray(state.currentQuestion.answers)) {
            state.currentQuestion.answers = [];
          }
          state.currentQuestion.answers.push(action.payload);
          state.currentQuestion.answerCount = state.currentQuestion.answers.length;
        }
      })
      .addCase(postAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default questionSlice.reducer;
