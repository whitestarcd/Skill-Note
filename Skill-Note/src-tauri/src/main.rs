#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine as _;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

fn sanitize_folder_name(input: &str) -> String {
    let mut out = String::new();
    for ch in input.chars() {
        let valid = ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == ' ';
        out.push(if valid { ch } else { '_' });
    }

    out.trim().trim_matches('.').to_string()
}

#[tauri::command]
fn save_media_file(
    app: tauri::AppHandle,
    base64_data: String,
    extension: String,
    document_dir: Option<String>,
) -> Result<String, String> {
    let base_documents_dir = app
        .path()
        .document_dir()
        .map_err(|err| format!("failed to resolve documents dir: {err}"))?;

    let doc_dir_raw = document_dir
        .unwrap_or_else(|| "untitled-document".to_string());
    let doc_dir_name = {
        let sanitized = sanitize_folder_name(&doc_dir_raw);
        if sanitized.is_empty() {
            "untitled-document".to_string()
        } else {
            sanitized
        }
    };

    let media_dir: PathBuf = base_documents_dir
        .join("Skill-Note")
        .join(doc_dir_name)
        .join("media");
    fs::create_dir_all(&media_dir).map_err(|err| format!("failed to create media dir: {err}"))?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|err| format!("failed to read system time: {err}"))?
        .as_millis();

    let safe_ext = extension
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect::<String>();

    let ext = if safe_ext.is_empty() {
        "bin".to_string()
    } else {
        safe_ext
    };

    let file_name = format!("sn_media_{timestamp}.{ext}");
    let file_path = media_dir.join(file_name);

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|err| format!("failed to decode media data: {err}"))?;

    fs::write(&file_path, bytes).map_err(|err| format!("failed to write media file: {err}"))?;

    Ok(file_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_media_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
