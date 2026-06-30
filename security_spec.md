# Security Specification for Mecánico Particular Firestore Database

## 1. Data Invariants

- **Ownership and Access Separation**: A user can only access and modify their own workshop configurations (`/taller_config/{userId}`), their own clients (`/clientes/{clienteId}`), and their own budget/invoice documents (`/documentos/{documentoId}`).
- **Verified Sign-in constraint**: Only users with verified emails (`request.auth.token.email_verified == true`) are permitted to write data.
- **Strict Size Limits**: All string values are bounded in length (e.g., IDs must be `<= 128` characters, names `<= 100` characters, and long text fields like symptoms/legal terms capped appropriately) to prevent Denial of Wallet and Resource Poisoning attacks.
- **Immutability**: Once a client or document is created, its `userId` association cannot be changed.
- **Id Integrity**: Every document ID must match the alphanumeric `isValidId()` regex guard `^[a-zA-Z0-9_\-]+$`.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads are designed to bypass security checks and must be rejected by Firestore Security Rules.

### Payload 1: Identity Spoofing (Owner Hijack in Cliente)
An authenticated user attempts to register a client with a different `userId` field to spoof ownership.
```json
{
  "id": "cli_123",
  "nombre": "Juan Pérez",
  "matricula": "1234ABC",
  "userId": "victim_user_uid_999"
}
```

### Payload 2: Privilege Escalation / Ghost Fields in TallerConfig
User attempts to modify a configuration with unmapped properties (shadow fields).
```json
{
  "nombreComercial": "Taller Express",
  "direccion": "Calle Mayor 1",
  "telefono": "600123456",
  "isSystemAdmin": true
}
```

### Payload 3: Value Poisoning (Invalid Type in Cliente)
User attempts to write an invalid boolean structure where a string is expected for `estadoActual`.
```json
{
  "id": "cli_123",
  "nombre": "Juan Pérez",
  "matricula": "1234ABC",
  "estadoActual": true,
  "userId": "attacker_user_uid"
}
```

### Payload 4: Invalid Document ID / Resource Poisoning
Attacker tries to write with a massive 10KB string document ID containing junk characters.
```json
{
  "id": "cli_junk_id_very_long...",
  "nombre": "Attack Test",
  "matricula": "1234XYZ",
  "userId": "attacker_user_uid"
}
```

### Payload 5: Unverified User Write
User with `email_verified: false` attempts to save a new invoice.
```json
{
  "id": "doc_456",
  "cliente": "Marcos López",
  "matricula": "5678DEF",
  "userId": "unverified_user_uid"
}
```

### Payload 6: Ownership Takeover via Update (Cliente)
User attempts to change the `userId` field of an existing client document.
```json
{
  "id": "cli_123",
  "nombre": "Juan Pérez",
  "matricula": "1234ABC",
  "userId": "new_attacker_uid"
}
```

### Payload 7: State Shortcutting (Illegal State Modification)
User attempts to change a read-only system-verified state or format in `AveriaResuelta`.
```json
{
  "id": "ave_789",
  "titulo": "Fallo Eléctrico",
  "sintomas": "No arranca",
  "solucion": "Cambiar fusible F12",
  "autor": "Anónimo",
  "verificado": true,
  "userId": "attacker_uid"
}
```

### Payload 8: String Length Overflow (Denial of Wallet)
Attacker tries to save a client name with a 500,000-character string.
```json
{
  "id": "cli_123",
  "nombre": "A[Repeated 500k times]...",
  "matricula": "1234ABC",
  "userId": "attacker_user_uid"
}
```

### Payload 9: Orphaned Document (Invoice without owner)
Attacker attempts to create a document draft without `userId`.
```json
{
  "id": "doc_999",
  "cliente": "Luis Gómez",
  "matricula": "4321CBA"
}
```

### Payload 10: Unauthorized Community Deletion
User attempts to delete a community post authored by a different user.
- **Request**: DELETE `/comunidad/ave_user_xyz` by user `attacker_uid`

### Payload 11: Direct Write to Foreign TallerConfig
Attacker attempts to write or overwrite `/taller_config/victim_uid`.
- **Request**: WRITE `/taller_config/victim_uid` by user `attacker_uid`

### Payload 12: Empty Array Bypass in Document Items
Attacker attempts to bypass validation of invoice schema by inserting negative quantities.
```json
{
  "id": "doc_111",
  "cliente": "Pedro",
  "matricula": "0000AAA",
  "userId": "attacker_uid",
  "items": [{ "id": 1, "concepto": "Falso", "cantidad": -50, "precio": -100 }]
}
```

---

## 3. Test Verification Suite
All "Dirty Dozen" requests are evaluated in the security suite and verified to return `PERMISSION_DENIED` under all circumstances.
