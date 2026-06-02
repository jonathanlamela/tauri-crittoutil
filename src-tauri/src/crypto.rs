use aes::Aes128;
use aes::Aes192;
use aes::Aes256;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use cbc::{Decryptor, Encryptor};
use cipher::{BlockDecryptMut, BlockEncryptMut, KeyIvInit, block_padding::Pkcs7};
use des::Des;
use md5;
use rand::RngCore;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CryptoError {
    pub message: String,
}

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

fn err(msg: &str) -> CryptoError {
    CryptoError { message: msg.to_string() }
}

#[tauri::command]
pub fn hash_md5(plaintext: String) -> String {
    let digest = md5::compute(plaintext.as_bytes());
    format!("{:x}", digest)
}

#[tauri::command]
pub fn encrypt_aes_cbc(plaintext: String, key: String) -> Result<String, CryptoError> {
    let key_bytes = key.as_bytes();
    let plaintext_bytes = plaintext.as_bytes();

    let mut iv = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut iv);

    let ciphertext = match key_bytes.len() {
        16 => {
            let enc: Encryptor<Aes128> = Encryptor::new_from_slices(key_bytes, &iv)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        24 => {
            let enc: Encryptor<Aes192> = Encryptor::new_from_slices(key_bytes, &iv)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        32 => {
            let enc: Encryptor<Aes256> = Encryptor::new_from_slices(key_bytes, &iv)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        _ => return Err(err("AES key must be 16, 24, or 32 bytes")),
    };

    Ok(format!("{}:{}", BASE64.encode(iv), BASE64.encode(ciphertext)))
}

#[tauri::command]
pub fn decrypt_aes_cbc(payload: String, key: String) -> Result<String, CryptoError> {
    let key_bytes = key.as_bytes();
    let parts: Vec<&str> = payload.split(':').collect();
    if parts.len() != 2 {
        return Err(err("Invalid payload format: expected iv:cipher"));
    }
    let iv_bytes = BASE64.decode(parts[0]).map_err(|_| err("Invalid IV base64"))?;
    let cipher_bytes = BASE64.decode(parts[1]).map_err(|_| err("Invalid cipher base64"))?;

    let plaintext = match key_bytes.len() {
        16 => {
            let dec: Decryptor<Aes128> = Decryptor::new_from_slices(key_bytes, &iv_bytes)
                .map_err(|_| err("Invalid key/IV length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        24 => {
            let dec: Decryptor<Aes192> = Decryptor::new_from_slices(key_bytes, &iv_bytes)
                .map_err(|_| err("Invalid key/IV length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        32 => {
            let dec: Decryptor<Aes256> = Decryptor::new_from_slices(key_bytes, &iv_bytes)
                .map_err(|_| err("Invalid key/IV length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        _ => return Err(err("AES key must be 16, 24, or 32 bytes")),
    };

    String::from_utf8(plaintext).map_err(|_| err("Decrypted data is not valid UTF-8"))
}

type AesEcbEnc128 = ecb::Encryptor<Aes128>;
type AesEcbEnc192 = ecb::Encryptor<Aes192>;
type AesEcbEnc256 = ecb::Encryptor<Aes256>;
type AesEcbDec128 = ecb::Decryptor<Aes128>;
type AesEcbDec192 = ecb::Decryptor<Aes192>;
type AesEcbDec256 = ecb::Decryptor<Aes256>;

#[tauri::command]
pub fn encrypt_aes_ecb(plaintext: String, key: String) -> Result<String, CryptoError> {
    use cipher::KeyInit;
    let key_bytes = key.as_bytes();
    let plaintext_bytes = plaintext.as_bytes();

    let ciphertext = match key_bytes.len() {
        16 => {
            let enc = AesEcbEnc128::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        24 => {
            let enc = AesEcbEnc192::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        32 => {
            let enc = AesEcbEnc256::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext_bytes)
        }
        _ => return Err(err("AES key must be 16, 24, or 32 bytes")),
    };

    Ok(BASE64.encode(ciphertext))
}

#[tauri::command]
pub fn decrypt_aes_ecb(payload: String, key: String) -> Result<String, CryptoError> {
    use cipher::KeyInit;
    let key_bytes = key.as_bytes();
    let cipher_bytes = BASE64.decode(&payload).map_err(|_| err("Invalid base64 payload"))?;

    let plaintext = match key_bytes.len() {
        16 => {
            let dec = AesEcbDec128::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        24 => {
            let dec = AesEcbDec192::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        32 => {
            let dec = AesEcbDec256::new_from_slice(key_bytes)
                .map_err(|_| err("Invalid key length"))?;
            dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
                .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?
        }
        _ => return Err(err("AES key must be 16, 24, or 32 bytes")),
    };

    String::from_utf8(plaintext).map_err(|_| err("Decrypted data is not valid UTF-8"))
}

type DesEcbEnc = ecb::Encryptor<Des>;
type DesEcbDec = ecb::Decryptor<Des>;
type DesCbcEnc = Encryptor<Des>;
type DesCbcDec = Decryptor<Des>;

#[tauri::command]
pub fn encrypt_des_ecb(plaintext: String, key: String) -> Result<String, CryptoError> {
    use cipher::KeyInit;
    let key_bytes = key.as_bytes();
    if key_bytes.len() != 8 {
        return Err(err("DES key must be exactly 8 bytes"));
    }
    let enc = DesEcbEnc::new_from_slice(key_bytes)
        .map_err(|_| err("Invalid key length"))?;
    let ciphertext = enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext.as_bytes());
    Ok(BASE64.encode(ciphertext))
}

#[tauri::command]
pub fn decrypt_des_ecb(payload: String, key: String) -> Result<String, CryptoError> {
    use cipher::KeyInit;
    let key_bytes = key.as_bytes();
    if key_bytes.len() != 8 {
        return Err(err("DES key must be exactly 8 bytes"));
    }
    let cipher_bytes = BASE64.decode(&payload).map_err(|_| err("Invalid base64 payload"))?;
    let dec = DesEcbDec::new_from_slice(key_bytes)
        .map_err(|_| err("Invalid key length"))?;
    let plaintext = dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
        .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?;
    String::from_utf8(plaintext).map_err(|_| err("Decrypted data is not valid UTF-8"))
}

#[tauri::command]
pub fn encrypt_des_cbc(plaintext: String, key: String) -> Result<String, CryptoError> {
    let key_bytes = key.as_bytes();
    if key_bytes.len() != 8 {
        return Err(err("DES key must be exactly 8 bytes"));
    }
    let mut iv = [0u8; 8];
    rand::thread_rng().fill_bytes(&mut iv);
    let enc: DesCbcEnc = DesCbcEnc::new_from_slices(key_bytes, &iv)
        .map_err(|_| err("Invalid key/IV length"))?;
    let ciphertext = enc.encrypt_padded_vec_mut::<Pkcs7>(plaintext.as_bytes());
    Ok(format!("{}:{}", BASE64.encode(iv), BASE64.encode(ciphertext)))
}

#[tauri::command]
pub fn decrypt_des_cbc(payload: String, key: String) -> Result<String, CryptoError> {
    let key_bytes = key.as_bytes();
    if key_bytes.len() != 8 {
        return Err(err("DES key must be exactly 8 bytes"));
    }
    let parts: Vec<&str> = payload.split(':').collect();
    if parts.len() != 2 {
        return Err(err("Invalid payload format: expected iv:cipher"));
    }
    let iv_bytes = BASE64.decode(parts[0]).map_err(|_| err("Invalid IV base64"))?;
    let cipher_bytes = BASE64.decode(parts[1]).map_err(|_| err("Invalid cipher base64"))?;
    let dec: DesCbcDec = DesCbcDec::new_from_slices(key_bytes, &iv_bytes)
        .map_err(|_| err("Invalid key/IV length"))?;
    let plaintext = dec.decrypt_padded_vec_mut::<Pkcs7>(&cipher_bytes)
        .map_err(|_| err("Decryption failed: invalid key or corrupted data"))?;
    String::from_utf8(plaintext).map_err(|_| err("Decrypted data is not valid UTF-8"))
}

#[tauri::command]
pub fn generate_key(bits: u32) -> Result<String, CryptoError> {
    let length = (bits / 8) as usize;
    const ALPHABET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    let mut key = String::with_capacity(length);
    for _ in 0..length {
        let mut byte = [0u8; 1];
        loop {
            rng.fill_bytes(&mut byte);
            if (byte[0] as usize) < ALPHABET.len() * (256 / ALPHABET.len()) {
                key.push(ALPHABET[byte[0] as usize % ALPHABET.len()] as char);
                break;
            }
        }
    }
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── MD5 ──────────────────────────────────────────────────────────────────

    #[test]
    fn md5_known_vector() {
        assert_eq!(hash_md5("hello".to_string()), "5d41402abc4b2a76b9719d911017c592");
    }

    #[test]
    fn md5_empty_string() {
        assert_eq!(hash_md5("".to_string()), "d41d8cd98f00b204e9800998ecf8427e");
    }

    // ── AES-CBC ───────────────────────────────────────────────────────────────

    #[test]
    fn aes_cbc_roundtrip_128() {
        let key = "0123456789abcdef".to_string(); // 16 bytes
        let plaintext = "Hello, AES-128-CBC!".to_string();
        let ciphertext = encrypt_aes_cbc(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_cbc(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_cbc_roundtrip_192() {
        let key = "0123456789abcdef01234567".to_string(); // 24 bytes
        let plaintext = "Hello, AES-192-CBC!".to_string();
        let ciphertext = encrypt_aes_cbc(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_cbc(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_cbc_roundtrip_256() {
        let key = "0123456789abcdef0123456789abcdef".to_string(); // 32 bytes
        let plaintext = "Hello, AES-256-CBC!".to_string();
        let ciphertext = encrypt_aes_cbc(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_cbc(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_cbc_wrong_key_length() {
        let err = encrypt_aes_cbc("text".to_string(), "short".to_string()).unwrap_err();
        assert!(err.message.contains("16, 24, or 32"));
    }

    #[test]
    fn aes_cbc_wrong_key_on_decrypt() {
        let key = "0123456789abcdef".to_string();
        let ciphertext = encrypt_aes_cbc("secret".to_string(), key).unwrap();
        let wrong_key = "fedcba9876543210".to_string();
        let result = decrypt_aes_cbc(ciphertext, wrong_key);
        assert!(result.is_err());
    }

    #[test]
    fn aes_cbc_invalid_payload_format() {
        let err = decrypt_aes_cbc("notavalidpayload".to_string(), "0123456789abcdef".to_string()).unwrap_err();
        assert!(err.message.contains("Invalid payload format"));
    }

    // ── AES-ECB ───────────────────────────────────────────────────────────────

    #[test]
    fn aes_ecb_roundtrip_128() {
        let key = "0123456789abcdef".to_string();
        let plaintext = "Hello, AES-128-ECB!".to_string();
        let ciphertext = encrypt_aes_ecb(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_ecb(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_ecb_roundtrip_192() {
        let key = "0123456789abcdef01234567".to_string();
        let plaintext = "Hello, AES-192-ECB!".to_string();
        let ciphertext = encrypt_aes_ecb(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_ecb(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_ecb_roundtrip_256() {
        let key = "0123456789abcdef0123456789abcdef".to_string();
        let plaintext = "Hello, AES-256-ECB!".to_string();
        let ciphertext = encrypt_aes_ecb(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_aes_ecb(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn aes_ecb_wrong_key_length() {
        let err = encrypt_aes_ecb("text".to_string(), "short".to_string()).unwrap_err();
        assert!(err.message.contains("16, 24, or 32"));
    }

    // ── DES-ECB ───────────────────────────────────────────────────────────────

    #[test]
    fn des_ecb_roundtrip() {
        let key = "8bytekey".to_string(); // 8 bytes
        let plaintext = "Hello, DES-ECB!".to_string();
        let ciphertext = encrypt_des_ecb(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_des_ecb(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn des_ecb_wrong_key_length() {
        let err = encrypt_des_ecb("text".to_string(), "short".to_string()).unwrap_err();
        assert!(err.message.contains("8 bytes"));
    }

    #[test]
    fn des_ecb_wrong_key_on_decrypt() {
        let key = "8bytekey".to_string();
        let ciphertext = encrypt_des_ecb("secret".to_string(), key).unwrap();
        let result = decrypt_des_ecb(ciphertext, "otherkey".to_string());
        assert!(result.is_err());
    }

    // ── DES-CBC ───────────────────────────────────────────────────────────────

    #[test]
    fn des_cbc_roundtrip() {
        let key = "8bytekey".to_string();
        let plaintext = "Hello, DES-CBC!".to_string();
        let ciphertext = encrypt_des_cbc(plaintext.clone(), key.clone()).unwrap();
        let decrypted = decrypt_des_cbc(ciphertext, key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn des_cbc_wrong_key_length() {
        let err = encrypt_des_cbc("text".to_string(), "short".to_string()).unwrap_err();
        assert!(err.message.contains("8 bytes"));
    }

    #[test]
    fn des_cbc_invalid_payload_format() {
        let err = decrypt_des_cbc("notavalidpayload".to_string(), "8bytekey".to_string()).unwrap_err();
        assert!(err.message.contains("Invalid payload format"));
    }

    // ── generate_key ──────────────────────────────────────────────────────────

    #[test]
    fn generate_key_correct_lengths() {
        for bits in [64u32, 128, 192, 256, 512] {
            let key = generate_key(bits).unwrap();
            assert_eq!(key.len(), (bits / 8) as usize, "bits={bits}");
        }
    }

    #[test]
    fn generate_key_only_alphanumeric() {
        let key = generate_key(256).unwrap();
        assert!(key.chars().all(|c| c.is_ascii_alphanumeric()), "non-alphanumeric char in key: {key}");
    }

    #[test]
    fn generate_key_is_random() {
        let a = generate_key(256).unwrap();
        let b = generate_key(256).unwrap();
        assert_ne!(a, b, "two generated keys must not be identical");
    }
}
