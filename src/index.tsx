import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { csrf } from "hono/csrf";
import { FC } from "hono/jsx";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { validator } from "hono/validator";
import { db } from "./db/db";
import { Todo, insertTodoSchema, todos } from "./db/schema";

const app = new Hono();

app.use(secureHeaders());
app.use(csrf());
app.use(prettyJSON());
app.use(logger());

app.use(
	"/assets/*",
	serveStatic({
		root: "./",
		rewriteRequestPath: (path) =>
			path.replace(/^\/assets/, "/src/assets/built"),
	}),
);

function randomString(length: number, chars: string) {
	let result = "";
	for (let i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

const TodoItem: FC<Todo> = (props) => {
	const randomId = randomString(5, "abcdefghijklmnopqrstuvwxyz");
	return (
		<li class={props.completed ? "completed" : ""} id={randomId}>
			{props.title}{" "}
			<button
				hx-patch={`/${props.id}`}
				hx-vals={JSON.stringify({ completed: !props.completed })}
				hx-target={`#${randomId}`}
				hx-swap="outerHTML"
				type="button"
			>
				Complete
			</button>
			<button
				hx-delete={`/${props.id}`}
				hx-target={`#${randomId}`}
				hx-swap="delete"
				type="button"
			>
				Delete
			</button>
		</li>
	);
};

app.get("/", async (c) => {
	const allTodos = await db.select().from(todos);
	return c.html(
		<html lang="en-US">
			<head>
				<title>Bun+Hono</title>
				<link rel="stylesheet" href="/assets/main.css" />
				<script src="/assets/main.js" />
			</head>
			<body>
				<main>
					<ul id="todos">
						{allTodos.map((todo) => (
							<TodoItem {...todo} />
						))}
					</ul>
					<form
						hx-post="/"
						hx-target="#todos"
						hx-swap="beforeend"
						{...{
							"hx-on::after-request":
								"if (event.detail.successful) {this.reset(); this.focus()}",
						}}
					>
						<input type="text" name="title" />
						<button type="submit" ariaLabel="Add New Todo">
							+
						</button>
					</form>
				</main>
			</body>
		</html>,
	);
});

app.post(
	"/",
	validator("form", (value, c) => {
		const parsed = insertTodoSchema.pick({ title: true }).safeParse(value);
		if (!parsed.success) {
			return c.text("Invalid!", 400);
		}
		return parsed.data;
	}),
	async (c) => {
		const { title } = c.req.valid("form");
		const newTodo = await db.insert(todos).values({ title }).returning();
		return c.html(
			<>
				{newTodo.map((todo) => (
					<TodoItem {...todo} />
				))}
			</>,
		);
	},
);

app.delete("/:id", async (c) => {
	const id = Number.parseInt(c.req.param("id"));
	await db.delete(todos).where(eq(todos.id, id));
	return c.text("Deleted");
});

app.patch(
	"/:id",
	validator("form", (value, c) => {
		const parsed = insertTodoSchema.pick({ completed: true }).safeParse(value);
		console.log(value);
		if (!parsed.success) {
			return c.text("Invalid!", 400);
		}
		console.log(parsed.data);
		return parsed.data;
	}),
	async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		const { completed } = c.req.valid("form");
		console.log(completed);
		const updatedTodo = await db
			.update(todos)
			.set({ completed })
			.where(eq(todos.id, id))
			.returning();
		console.log(updatedTodo);
		return c.html(
			<>
				{updatedTodo.map((todo) => (
					<TodoItem {...todo} />
				))}
			</>,
		);
	},
);

export default app;
