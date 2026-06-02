mod crypto;

use crypto::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hash_md5,
            hash_md5_bytes,
            encrypt_aes_cbc,
            decrypt_aes_cbc,
            encrypt_aes_ecb,
            decrypt_aes_ecb,
            encrypt_des_ecb,
            decrypt_des_ecb,
            encrypt_des_cbc,
            decrypt_des_cbc,
            generate_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
