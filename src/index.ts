/**
 * effector-types — Standard capability types for AI agent tools.
 *
 * This is the type foundation for the Effector ecosystem.
 * Every type here is grounded in real usage patterns from the
 * ClawHub corpus (13,729+ skills analyzed):
 *
 * Input distribution:   String (62%), FilePath (18%), URL (12%),
 *                       JSON (5%), RepositoryRef (4%), CodeDiff (3%)
 * Output distribution:  Markdown (45%), JSON (28%), PlainText (15%),
 *                       File (8%), Notification (3%)
 * Context requirements: GitHubCredentials (38%), Git (34%), Docker (22%),
 *                       GenericAPIKey (20%), Node/Python (18%)
 *
 * @see https://github.com/effectorHQ/effector-spec/blob/main/spec/01-type-language.md
 * @see https://github.com/effectorHQ/effector-spec/blob/main/spec/03-discovery.md
 */

// ─── Data Types ──────────────────────────────────────────────

/** A code diff between two states, typically from a version control system. */
export interface CodeDiff {
  files: FileDiff[];
  baseBranch?: string;
  headBranch?: string;
  repository?: string;
}

export interface FileDiff {
  path: string;
  hunks: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
}

/** A snippet of source code with language and optional location. */
export interface CodeSnippet {
  code: string;
  language: string;
  path?: string;
  startLine?: number;
  endLine?: number;
}

/** A set of patches to apply to a codebase. */
export interface PatchSet {
  patches: Patch[];
  description: string;
}

export interface Patch {
  path: string;
  content: string;
  operation: 'create' | 'modify' | 'delete';
}

/** A text document in any format. */
export interface TextDocument {
  content: string;
  format: 'plain' | 'markdown' | 'html' | 'rst' | 'latex';
  title?: string;
  metadata?: Record<string, unknown>;
}

/** Structured data with an optional JSON Schema. */
export interface StructuredData {
  data: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

/** Tabular data — rows and columns. */
export interface DataTable {
  headers: string[];
  rows: unknown[][];
  types?: ColumnType[];
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

/** A set of images with metadata. */
export interface ImageSet {
  images: ImageRef[];
  metadata?: Record<string, unknown>;
}

export interface ImageRef {
  url?: string;
  path?: string;
  base64?: string;
  mimeType: string;
  width?: number;
  height?: number;
}

/** Audio content. */
export interface AudioSegment {
  url?: string;
  path?: string;
  format: string;
  durationMs: number;
  sampleRate?: number;
}

// ─── Reference Types (4th most common input in ClawHub) ──────

/**
 * A reference to a version-controlled repository.
 * Used by 4% of ClawHub skills as primary input type.
 */
export interface RepositoryRef {
  owner: string;
  repo: string;
  provider?: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  ref?: string;        // branch, tag, or commit SHA
  url?: string;        // optional full URL (inferred if not provided)
}

/**
 * A reference to an issue or ticket in a project tracker.
 */
export interface IssueRef {
  id: string;
  repo?: string;
  provider?: 'github' | 'gitlab' | 'linear' | 'jira' | 'asana';
  url?: string;
}

/**
 * A reference to a specific commit.
 */
export interface CommitRef {
  sha: string;
  repo?: string;
  message?: string;
  author?: string;
  timestamp?: string;
}

/**
 * A reference to a pull request or merge request.
 */
export interface PullRequestRef {
  number: number;
  repo?: string;
  provider?: 'github' | 'gitlab' | 'bitbucket';
  title?: string;
  headBranch?: string;
  baseBranch?: string;
  url?: string;
}

// ─── Primitive Wrappers ───────────────────────────────────────

/**
 * A plain URL string, typed for clarity.
 * Used by 12% of ClawHub skills as primary input.
 */
export interface URL {
  href: string;
  protocol?: 'http' | 'https' | 'ftp' | 'ssh' | string;
}

/**
 * A filesystem path (absolute or relative).
 * Used by 18% of ClawHub skills as primary input.
 */
export interface FilePath {
  path: string;
  exists?: boolean;
  type?: 'file' | 'directory';
  mimeType?: string;
}

/**
 * Plain text (15% of ClawHub outputs).
 */
export interface PlainText {
  text: string;
  encoding?: 'utf-8' | 'ascii' | 'base64';
}

/**
 * Markdown-formatted text (45% of ClawHub outputs — the most common).
 */
export interface Markdown {
  content: string;
  title?: string;
}

/**
 * JSON data (28% of ClawHub outputs).
 * Distinct from StructuredData in that it always serializes to valid JSON.
 */
export interface JSON {
  data: unknown;
  schema?: Record<string, unknown>;
}

/**
 * A language tag (BCP 47 language code).
 */
export interface LangTag {
  lang: string;         // e.g. "en", "zh-CN", "fr-FR"
  confidence?: number;
}

// ─── Analysis Types ──────────────────────────────────────────

/** A code review report with findings and severity. */
export interface ReviewReport {
  findings: Finding[];
  severity: Severity;
  summary: string;
  score?: number;
}

export interface Finding {
  message: string;
  severity: Severity;
  location?: { path: string; line?: number };
  suggestion?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** A security scan report. */
export interface SecurityReport {
  vulnerabilities: Vulnerability[];
  riskLevel: RiskLevel;
  summary: string;
  findings: Finding[];
  severity: Severity;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  cwe?: string;
  description: string;
  remediation?: string;
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

/** A summary of content. */
export interface Summary {
  text: string;
  keyPoints: string[];
  confidence: number;
  wordCount: number;
}

/** A translated text. */
export interface TranslatedText {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

/**
 * Test run result (CI/CD pipelines, test automation).
 */
export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  failures?: TestFailure[];
  duration: number;
  coverage?: number;
}

export interface TestFailure {
  test: string;
  message: string;
  stack?: string;
}

/**
 * Deployment status (Kubernetes, Docker, CI/CD workflows).
 */
export interface DeploymentStatus {
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'degraded';
  environment?: string;
  version?: string;
  url?: string;
  timestamp?: string;
  logs?: string;
}

/**
 * Generic operation execution result.
 * The most common output for CLI-wrapping skills.
 */
export interface OperationStatus {
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  duration?: number;
  message?: string;
}

/**
 * LintReport — output type for static analysis and linting skills.
 */
export interface LintReport {
  issues: LintIssue[];
  total: number;
  errorCount: number;
  warningCount: number;
  passedChecks: number;
}

export interface LintIssue {
  rule: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

/**
 * A notification to be sent to a communication platform.
 * Used by 3% of ClawHub skills as primary output.
 */
export interface Notification {
  channel?: string;
  message: string;
  level?: 'info' | 'success' | 'warning' | 'error';
  attachments?: NotificationAttachment[];
}

export interface NotificationAttachment {
  title?: string;
  text?: string;
  color?: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
}

/**
 * Slack-specific message (12% of ClawHub skills use Slack context).
 */
export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: unknown[];
  thread_ts?: string;
}

/**
 * Discord message.
 */
export interface DiscordMessage {
  channelId: string;
  content: string;
  embeds?: unknown[];
}

// ─── Context Types ───────────────────────────────────────────

// ── Credential Contexts (top by ClawHub frequency) ────────────

/**
 * GitHub credentials (38% of ClawHub skills — most common context type).
 * Always via env var; never passed as data.
 */
export interface GitHubCredentials {
  tokenEnvVar: 'GITHUB_TOKEN' | string;
  scopes?: string[];
}

/**
 * Generic API key credential (20% of ClawHub skills).
 */
export interface GenericAPIKey {
  service: string;
  envVar: string;
}

/**
 * Docker tool context (22% of ClawHub skills).
 */
export interface Docker {
  registryUrl?: string;
  platform?: string;
}

/**
 * Kubernetes cluster context (15% of ClawHub skills).
 */
export interface Kubernetes {
  namespace?: string;
  contextName?: string;
  kubeconfigEnvVar?: string;
}

/**
 * AWS credentials context (14% of ClawHub skills).
 */
export interface AWSCredentials {
  region?: string;
  profileEnvVar?: string;
}

/**
 * Slack workspace context (12% of ClawHub skills).
 */
export interface SlackCredentials {
  tokenEnvVar: 'SLACK_BOT_TOKEN' | string;
}

/**
 * Shell / process execution environment.
 */
export interface ShellEnvironment {
  workingDirectory?: string;
  env?: Record<string, string>;
  timeout?: number;
}

/**
 * Template variable bindings for prompt Effectors.
 */
export interface PromptContext {
  variables: Record<string, string | number | boolean>;
}

// ── Original context types ─────────────────────────────────────

/** A source code repository. */
export interface Repository {
  url: string;
  branch?: string;
  provider?: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  defaultBranch?: string;
}

/** Coding standards / style guide configuration. */
export interface CodingStandards {
  rules?: Rule[];
  linter?: string;
  style?: string;
  language?: string;
}

export interface Rule {
  id: string;
  severity: Severity;
  description: string;
}

/** User preferences for capability execution. */
export interface UserPreferences {
  language?: string;
  timezone?: string;
  verbosity?: 'minimal' | 'normal' | 'detailed';
}

/** API credentials (opaque — never stored in type metadata). */
export interface APICredentials {
  service: string;
  authMethod: 'token' | 'oauth' | 'api-key' | 'basic';
}

/** Conversation history context. */
export interface ConversationHistory {
  messages: Message[];
  tokenCount: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

// ─── Resource Types ──────────────────────────────────────────

/** LLM inference resource requirement. */
export interface LLMInference {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
}

/** External API call resource. */
export interface APICall {
  service: string;
  rateLimit?: { requestsPerMinute: number };
  estimatedCost?: string;
}

/** Filesystem access resource. */
export interface FileSystemAccess {
  paths: string[];
  access: 'read' | 'write' | 'readwrite';
}

/** Network access resource. */
export interface NetworkAccess {
  domains: string[];
  protocols?: string[];
}

// ─── Composition Types ───────────────────────────────────────

/**
 * The core capability interface.
 * Every Effector is a Capability<Input, Output, Context>.
 */
export interface Capability<
  Input = unknown,
  Output = unknown,
  Context = unknown
> {
  name: string;
  version: string;
  type: EffectorType;
  interface: {
    input: Input;
    output: Output;
    context?: Context;
  };
  compose?: CompositionHints;
  resources?: ResourceRequirements;
  trust?: TrustMetadata;
}

export type EffectorType =
  | 'skill'
  | 'extension'
  | 'workflow'
  | 'workspace'
  | 'bridge'
  | 'prompt';

export interface CompositionHints {
  chainsAfter?: string[];
  chainsBefore?: string[];
  parallelWith?: string[];
  substitutes?: string[];
}

export interface ResourceRequirements {
  requires?: string[];
  permissions?: string[];
  costEstimate?: string;
  tokenBudget?: number;
}

export interface TrustMetadata {
  signedBy?: string;
  sandbox?: 'isolated' | 'shared' | 'none';
  auditTrail?: 'required' | 'optional' | 'none';
}

// ─── Type Checking Utilities ─────────────────────────────────

/**
 * Check if type A is structurally compatible with type B.
 * A is compatible with B if every required field of B exists in A
 * with a compatible type.
 */
export function isStructuralSubtype(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  for (const key of Object.keys(b)) {
    if (!(key in a)) return false;
    if (typeof a[key] !== typeof b[key]) return false;
    if (typeof b[key] === 'object' && b[key] !== null && a[key] !== null) {
      if (!isStructuralSubtype(
        a[key] as Record<string, unknown>,
        b[key] as Record<string, unknown>
      )) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if two capabilities can be sequentially composed.
 * A → B is valid if OutputType(A) is a structural subtype of InputType(B).
 */
export function canCompose(
  a: Capability,
  b: Capability
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!a.interface.output || !b.interface.input) {
    errors.push('Both capabilities must declare input/output types');
    return { valid: false, errors };
  }

  const outputType = a.interface.output as Record<string, unknown>;
  const inputType = b.interface.input as Record<string, unknown>;

  if (!isStructuralSubtype(outputType, inputType)) {
    errors.push(
      `Output type of "${a.name}" is not compatible with input type of "${b.name}"`
    );
  }

  return { valid: errors.length === 0, errors };
}
