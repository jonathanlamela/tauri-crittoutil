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
