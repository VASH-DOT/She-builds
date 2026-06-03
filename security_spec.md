# Security Specification - Staff Coffee Corner (TDD)

## 1. Data Invariants
1. **Gratitude Message Invariants**:
   - `id` must be a valid document ID match.
   - `userId` matches the authenticating current viewer `request.auth.uid`.
   - `content` must be a string up to 280 characters (no spam).
   - `color` must belong to a restricted set of pastel theme colors.
   - `createdAt` must match `request.time` exactly.
   - Updates must only allow changing content or sticky color, and only by the original creator.

2. **Shared Songs Invariants**:
   - Only standard video titles and matching IDs can be saved in `songs/current`.
   - Every signed in user can set the current song to share, but the incoming `addedByName` must match their verified identity context.
   - Submitting users cannot modify other details.

3. **Presence Invariants**:
   - The document ID *must* be the user's authenticating UID (`request.auth.uid`).
   - `lastActiveAt` must equal the server time `request.time`.
   - Read is open to all signed-in users. Write is only allowed by the owner of the UID.

4. **Reaction Invariants**:
   - Document ID must draw from strict reactions list: `energized`, `appreciated`, `inspired`, `supported`.
   - Writes must only increment `count` with an integer by 1 or more, preventing users from resetting counters.

5. **Challenge Reply Invariants**:
   - `id` must be unique.
   - `userId` must match `request.auth.uid`.
   - `content` must be sound text up to 500 characters.

6. **Milestone Invariants**:
   - Users can create milestones where they are either the target or helper. No spoofing.
   - Type is strictly one of `birthday`, `achievement`, `milestone`.

---

## 2. The "Dirty Dozen" Exploit Payloads
The following payloads describe attempts to spoof, reset counters, bypass author identity, delete others' sticky notes, inject massive data, or escape state variables, all of which must return `PERMISSION_DENIED`.

1. **Identity Spoofing - Gratitude Post**: Attempt to post a gratitude note with a forged `userId` belonging to another user.
2. **Ghost Update Attack - Message Key Injection**: Attempting to update a gratitude note while inserting a `isPromoted: true` shadow key.
3. **Privilege Escalation - Milestone Theft**: Attempting to forge a celebration entry for another user using an arbitrary document ID with no ownership.
4. **Denial of Wallet (DoW) - ID Poisoning**: Trying to create a gratitude card where the document ID is a 20KB garbage string to exhaust Firestore memory of listeners.
5. **Reaction Reset Attack**: Attempting to issue a write payload representing `reactions/energized` with `count: 0` or reducing the count.
6. **Presence Forgery**: User A attempting to update User B's `/presence/{userId}` node to make them appear online.
7. **Future Timestamps Injection**: Attempting to post a message with `createdAt` set to 5 hours in the future to keep it on top.
8. **Spam Payload Expansion**: Trying to submit a sticky note gratitude text of 1 megabyte to overflow bandwidth bounds of real-time subscribers.
9. **Anonymous / Signed-out Creep**: Attempting to list all active presence documents and read staff profile information when not signed in at all.
10. **Malicious Song Hijack**: Attempting to overwrite `/songs/current` with a payload lacking a valid YouTube link signature.
11. **Gratitude Destruction**: Attempting to delete a sticky note belonging to a different colleague.
12. **Double-Click Reaction Spill**: Attempting to update reaction counts by direct string sets instead of transaction additions.

---

## 3. Test Runner Design
We will evaluate and deploy the ruleset through `firestore.rules`.
Every constraint is structured so that static validation (no cost) validates first before checking `resource.data` relational keys.
