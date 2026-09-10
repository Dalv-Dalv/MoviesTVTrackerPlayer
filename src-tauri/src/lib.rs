// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg(debug_assertions)]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS | Flags::RELOAD))
        .build()
}

#[cfg(not(debug_assertions))]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::Builder::new().build()
}

use std::io::{Read, Seek, SeekFrom};
use std::sync::{Mutex, OnceLock};

static FILE_CACHE: OnceLock<Mutex<Option<(String, std::fs::File)>>> = OnceLock::new();

#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    std::fs::metadata(&path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to get file size: {}", e))
}

#[tauri::command]
fn read_file_chunk(path: String, offset: u64, size: usize) -> Result<Vec<u8>, String> {
    let cache_mutex = FILE_CACHE.get_or_init(|| Mutex::new(None));
    let mut cache = cache_mutex.lock().map_err(|_| "Mutex poisoned")?;

    let needs_open = match &*cache {
        Some((cached_path, _)) => cached_path != &path,
        None => true,
    };

    if needs_open {
        let file = std::fs::File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;
        *cache = Some((path.clone(), file));
    }

    let file = &mut cache.as_mut().unwrap().1;

    // Jump to the exact byte offset mediainfo.js requested
    file.seek(SeekFrom::Start(offset))
        .map_err(|e| format!("Failed to seek: {}", e))?;

    let mut buffer = vec![0; size];
    let bytes_read = file
        .read(&mut buffer)
        .map_err(|e| format!("Failed to read chunk: {}", e))?;

    // Shrink buffer if we read less than requested (e.g., end of file)
    buffer.truncate(bytes_read);
    Ok(buffer)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_android_mediastore::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(prevent_default())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_exoplayer::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_libmpv::init());
    }

    builder
        .invoke_handler(tauri::generate_handler![get_file_size, read_file_chunk])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
