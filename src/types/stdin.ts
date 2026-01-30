/**
 * JSON data types sent by Claude Code via Statusline API
 */

export interface StdinData {
  hook_event_name?: string;
  transcript_path?: string;

  cwd?: string;
  workspace?: {
    current_dir?: string;
    project_dir?: string;
  };

  model?: {
    id?: string;
    display_name?: string;
  };

  context_window?: {
    context_window_size?: number;
    current_usage?: {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens?: number;
    } | null;
    used_percentage?: number | null;
    remaining_percentage?: number | null;
  };

  cost?: {
    total_cost_usd?: number;
    total_duration_ms?: number;
    total_api_duration_ms?: number;
    total_lines_added?: number;
    total_lines_removed?: number;
  };

  session_id?: string;
  version?: string;
  plan_name?: string;
}
