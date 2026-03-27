use tauri::Manager; // Import indispensable pour accéder aux méthodes de fenêtre

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // On récupère la fenêtre principale (souvent nommée "main" dans tauri.conf.json)
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                let _ = window.with_webview(|webview| {
                    unsafe {
                        // 0.8 correspond à 80%
                        let _ = webview.controller().SetZoomFactor(0.8);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}