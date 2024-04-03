import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const todos = sqliteTable("todos", {
	id: integer("id").primaryKey(),
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});
export type Todo = InferSelectModel<typeof todos>;
export const insertTodoSchema = createInsertSchema(todos, {
	completed: z.coerce.string().transform((val) => val === "true"),
});
