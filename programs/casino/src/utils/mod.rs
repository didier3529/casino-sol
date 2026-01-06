use solana_program::hash::hash;

/// Generate provably fair outcome using Solana's built-in SHA256
pub fn generate_outcome(server_seed: &str, client_seed: &str, nonce: u64) -> [u8; 32] {
    let combined = format!("{}-{}-{}", server_seed, client_seed, nonce);
    let hash_result = hash(combined.as_bytes());
    hash_result.to_bytes()
}

/// Verify server seed hash matches
pub fn verify_server_seed_hash(server_seed: &str, hash_hex: &str) -> bool {
    let hash_result = hash(server_seed.as_bytes());
    let computed_hash = hash_result.to_string();
    computed_hash == hash_hex
}

/// Generate server seed hash
pub fn hash_server_seed(server_seed: &str) -> String {
    let hash_result = hash(server_seed.as_bytes());
    hash_result.to_string()
}
