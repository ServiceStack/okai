# okai

AI-powered code generation tool for ServiceStack Apps. Generate TypeScript data models, C# APIs, migrations, and UI components from natural language prompts using LLMs.

## Features

- 🤖 **AI-Powered Generation** - Generate complete CRUD APIs from natural language prompts
- 📝 **TypeScript Data Models** - Define your data models in TypeScript with type safety
- 🔄 **Auto-Generate C# Code** - Automatically generate C# APIs, DTOs, and migrations
- 🗄️ **Database Migrations** - Create OrmLite migrations for your data models
- 🎨 **UI Components** - Generate Vue.js admin UI components
- 👀 **Watch Mode** - Auto-regenerate C# files when TypeScript models change
- 🔌 **Multiple LLM Support** - Use up to 5 different LLM models simultaneously
- 🔄 **Schema Conversion** - Convert existing database schemas to TypeScript models

## Installation

```bash
npm install -g okai
```

## Requirements

- Node.js >= 24.0.0
- A ServiceStack application with a `.sln` or `.slnx` file
- ServiceStack project structure with ServiceModel directory

## Quick Start

### 1. Navigate to your ServiceStack project

```bash
cd /path/to/app
```

### 2. Generate APIs from a prompt

```bash
okai "Create a blog system with posts, comments, and tags"
```

This will:
1. Generate TypeScript data models (`.d.ts` file)
2. Create C# API DTOs and AutoQuery services
3. Generate database migrations
4. Create Vue.js admin UI components
5. Show an interactive preview where you can review and accept the changes

### 3. Regenerate C# files from TypeScript models

```bash
okai Blog.d.ts
```

### 4. Watch mode for continuous regeneration

```bash
okai Blog.d.ts --watch
```

## Usage

### Generate from Natural Language Prompt

```bash
okai <prompt>
```

**Options:**
- `-m, --models <model,model,...>` - Specify up to 5 LLM models to use
- `-l, --license <LC-xxx>` - Provide ServiceStack license for premium models
- `-v, --verbose` - Display verbose logging

**Example:**

```bash
okai "Create a job board with companies, jobs, and applicants"
```

```bash
okai "Create an e-commerce system" --models gpt-4,claude-3-opus
```

### Regenerate C# Files

Regenerate C# APIs, migrations, and UI from an existing TypeScript definition file:

```bash
okai <models>.d.ts
```

**Options:**
- `-w, --watch` - Watch for changes and auto-regenerate

**Example:**

```bash
okai Blog.d.ts
okai Blog.d.ts --watch
```

### Remove Generated Files

Remove a TypeScript model file and all its generated C# files:

```bash
okai rm <models>.d.ts
```

**Example:**

```bash
okai rm Blog.d.ts
```

### List Available Models

Display available premium LLM models:

```bash
okai ls models
```

### Initialize Configuration

Create an `okai.json` configuration file with your project structure:

```bash
okai init
```

This auto-detects your ServiceStack project structure and creates a config file you can customize.

### Create Empty Model File

Create an empty TypeScript definition file for a specific model:

```bash
okai init <model>
```

**Example:**

```bash
okai init Blog
```

### Convert Database Schema

Convert .NET RDBMS table definitions to TypeScript data models:

```bash
okai convert <schema.json>
```

### Display Project Info

Show detected project information:

```bash
okai info
```

### Chat with OpenAI

Submit a chat request to OpenAI:

```bash
okai chat <prompt>
```

**Options:**
- `--system <prompt>` - Specify a system prompt

**Example:**

```bash
okai chat "Explain AutoQuery" --system "You are a ServiceStack expert"
```

## Environment Variables

Configure okai behavior using environment variables:

- `OKAI_URL` - Base URL for the okai service (default: `https://okai.servicestack.com`)
- `OKAI_MODELS` - Default LLM models to use (comma-separated)
- `SERVICESTACK_LICENSE` - Your ServiceStack license key for premium models

**Example:**

```bash
export OKAI_MODELS="gpt-4,claude-3-opus"
export SERVICESTACK_LICENSE="..."
okai "Create a booking system"
```

## Configuration File

The `okai.json` file allows you to customize project paths:

```json
{
  "projectName": "MyApp",
  "slnDir": "/path/to/solution",
  "hostDir": "/path/to/MyApp",
  "migrationsDir": "/path/to/MyApp/Migrations",
  "serviceModelDir": "/path/to/MyApp.ServiceModel",
  "serviceInterfaceDir": "/path/to/MyApp.ServiceInterfaces",
  "uiMjsDir": "/path/to/MyApp/wwwroot/admin/sections",
  "userType": "ApplicationUser",
  "userIdType": "string",
  "userLabel": "DisplayName"
}
```

Generate this file automatically with:

```bash
okai init
```

## TypeScript Data Model Format

Define your data models in TypeScript with special annotations:

```typescript
/*prompt: Create a blog system
api:       ~/MyApp.ServiceModel/Blog.cs
migration: ~/MyApp/Migrations/Migration1001.cs
ui:        ~/MyApp/wwwroot/admin/sections/Blog.mjs
*/

export enum PostStatus {
  Draft = "Draft",
  Published = "Published",
  Archived = "Archived"
}

export class BlogPost {
  id: number
  title: string
  slug: string
  content: string
  status: PostStatus
  authorId: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class Comment {
  id: number
  postId: number
  authorId: string
  content: string
  createdAt: Date
}

export class Tag {
  id: number
  name: string
  slug: string
}

export class PostTag {
  id: number
  postId: number
  tagId: number
}
```

### Header Comments

The header comment specifies where generated files should be saved:

- `prompt:` - The original prompt used to generate the models
- `api:` - Path to the generated C# API file
- `migration:` - Path to the generated migration file
- `ui:` - Path to the generated UI component file

Paths starting with `~/` are relative to the detected project directories.

## Generated Files

For each TypeScript model file, okai generates:

### 1. C# API DTOs and Services

AutoQuery CRUD APIs with proper attributes and validation:

```csharp
[Tag("Blog")]
public class QueryBlogPosts : QueryDb<BlogPost> {}

[Tag("Blog")]
public class CreateBlogPost : ICreateDb<BlogPost>, IReturn<IdResponse>
{
    public string Title { get; set; }
    public string Content { get; set; }
    // ...
}
```

### 2. Database Migrations

OrmLite migrations for creating tables:

```csharp
public class Migration1001 : MigrationBase
{
    public override void Up()
    {
        Db.CreateTable<BlogPost>();
        Db.CreateTable<Comment>();
        // ...
    }

    public override void Down()
    {
        Db.DropTable<PostTag>();
        Db.DropTable<Tag>();
        // ...
    }
}
```

### 3. Vue.js Admin UI Components

AutoQueryGrid components for admin interface:

```javascript
export default {
    group: "Blog",
    items: {
        BlogPosts: {
            type: 'BlogPost',
            component: {
                template: `
                <AutoQueryGrid :type="type"
                    selected-columns="id,title,status,authorId,publishedAt" />
                `,
            },
        },
        // ...
    }
}
```

## Workflow

### Typical Development Flow

1. **Generate from prompt:**
   ```bash
   okai "Create a task management system with projects, tasks, and assignments"
   ```

2. **Review the generated TypeScript models** in the interactive preview

3. **Accept the changes** by pressing `a` in the preview

4. **Edit the TypeScript models** if needed (add validations, change types, etc.)

5. **Regenerate C# files:**
   ```bash
   okai tasks.d.ts
   ```

6. **Use watch mode during development:**
   ```bash
   okai tasks.d.ts --watch
   ```

7. **Run migrations** in your ServiceStack app to create the database tables

8. **Access the admin UI** to manage your data

### Iterative Refinement

You can edit the `.d.ts` file and regenerate as many times as needed:

```bash
# Edit tasks.d.ts to add new properties or models
vim tasks.d.ts

# Regenerate all C# files
okai tasks.d.ts
```

## Examples

### E-Commerce System

```bash
okai "Create an e-commerce system with products, categories, orders, and customers"
```

### Booking System

```bash
okai "Create a booking system with services, time slots, bookings, and customers"
```

### Job Board

```bash
okai "Create a job board with companies, job listings, applications, and interviews"
```

### CRM System

```bash
okai "Create a CRM with contacts, companies, deals, and activities"
```

### Inventory Management

```bash
okai "Create an inventory system with warehouses, products, stock levels, and transfers"
```

## Tips

### Use Specific Prompts

The more specific your prompt, the better the results:

❌ **Too vague:**
```bash
okai "Create a blog"
```

✅ **Better:**
```bash
okai "Create a blog system with posts, comments, tags, categories, and authors. Posts should have status (draft/published), featured images, and SEO metadata"
```

### Leverage Multiple Models

Use multiple LLM models to get the best results:

```bash
okai "Create a social network" --models gpt-4,claude-3-opus,gemini-pro
```

The tool will use consensus from multiple models to generate better data structures.

### Customize Generated Code

After generation, you can:
- Edit the TypeScript models to add custom properties
- Add TypeScript decorators for validation
- Modify relationships between models
- Then regenerate the C# code with `okai <file>.d.ts`

### Watch Mode for Rapid Development

Use watch mode while developing:

```bash
okai Blog.d.ts --watch
```

Now every time you save `Blog.d.ts`, the C# files are automatically regenerated.

## Troubleshooting

### "No .sln or .slnx file found"

Make sure you're running okai from within a ServiceStack project directory. Alternatively, create an `okai.json` config file:

```bash
okai init
```

### "Could not find ServiceModel directory"

Ensure your ServiceStack project has a `ServiceModel` project. You can override the path in `okai.json`:

```json
{
  "serviceModelDir": "/custom/path/to/ServiceModel"
}
```

### SSL Errors

If you encounter SSL certificate errors:

```bash
okai "your prompt" --ignore-ssl-errors
```

## Links

- [ServiceStack](https://servicestack.net)
- [ServiceStack Docs](https://docs.servicestack.net)
- [Support Forums](https://forums.servicestack.net)
- [GitHub Repository](https://github.com/ServiceStack/okai)

