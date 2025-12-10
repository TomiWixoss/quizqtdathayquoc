import axios from "axios";

// MongoDB Data API Configuration
// Lấy từ MongoDB Atlas > Data API > Enable
const MONGODB_DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL || "";
const MONGODB_API_KEY = import.meta.env.VITE_MONGODB_API_KEY || "";
const MONGODB_DATA_SOURCE =
  import.meta.env.VITE_MONGODB_DATA_SOURCE || "Cluster0";
const MONGODB_DATABASE = import.meta.env.VITE_MONGODB_DATABASE || "quizapp";

interface MongoDBAction {
  action:
    | "findOne"
    | "find"
    | "insertOne"
    | "insertMany"
    | "updateOne"
    | "updateMany"
    | "deleteOne"
    | "deleteMany"
    | "aggregate";
  collection: string;
  filter?: Record<string, unknown>;
  document?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  update?: Record<string, unknown>;
  pipeline?: Record<string, unknown>[];
  projection?: Record<string, unknown>;
  sort?: Record<string, number>;
  limit?: number;
  skip?: number;
}

export async function mongoDBAction<T = unknown>({
  action,
  collection,
  ...params
}: MongoDBAction): Promise<T> {
  const response = await axios.post(
    `${MONGODB_DATA_API_URL}/action/${action}`,
    {
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATABASE,
      collection,
      ...params,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": MONGODB_API_KEY,
      },
    }
  );

  return response.data;
}

// Helper functions
export const mongodb = {
  // Find one document
  findOne: <T>(collection: string, filter: Record<string, unknown>) =>
    mongoDBAction<{ document: T | null }>({
      action: "findOne",
      collection,
      filter,
    }),

  // Find many documents
  find: <T>(
    collection: string,
    filter: Record<string, unknown> = {},
    options?: { sort?: Record<string, number>; limit?: number; skip?: number }
  ) =>
    mongoDBAction<{ documents: T[] }>({
      action: "find",
      collection,
      filter,
      ...options,
    }),

  // Insert one document
  insertOne: <T>(collection: string, document: Record<string, unknown>) =>
    mongoDBAction<{ insertedId: string }>({
      action: "insertOne",
      collection,
      document,
    }),

  // Insert many documents
  insertMany: (collection: string, documents: Record<string, unknown>[]) =>
    mongoDBAction<{ insertedIds: string[] }>({
      action: "insertMany",
      collection,
      documents,
    }),

  // Update one document
  updateOne: (
    collection: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ) =>
    mongoDBAction<{ matchedCount: number; modifiedCount: number }>({
      action: "updateOne",
      collection,
      filter,
      update,
    }),

  // Update many documents
  updateMany: (
    collection: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ) =>
    mongoDBAction<{ matchedCount: number; modifiedCount: number }>({
      action: "updateMany",
      collection,
      filter,
      update,
    }),

  // Delete one document
  deleteOne: (collection: string, filter: Record<string, unknown>) =>
    mongoDBAction<{ deletedCount: number }>({
      action: "deleteOne",
      collection,
      filter,
    }),

  // Delete many documents
  deleteMany: (collection: string, filter: Record<string, unknown>) =>
    mongoDBAction<{ deletedCount: number }>({
      action: "deleteMany",
      collection,
      filter,
    }),

  // Aggregate pipeline
  aggregate: <T>(collection: string, pipeline: Record<string, unknown>[]) =>
    mongoDBAction<{ documents: T[] }>({
      action: "aggregate",
      collection,
      pipeline,
    }),
};

export default mongodb;
