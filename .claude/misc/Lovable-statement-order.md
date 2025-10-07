Let me explain the app's approach to statement ordering in the voting flow.

---

# Statement Ordering in Voting Flow - System Explanation

Your app implements a **dual-mode statement routing system** that can operate in two different modes:

## 🎯 **Two Modes of Operation**

### **Mode 1: Static Sequential Mode** (Fallback)
Simple, predictable ordering where users see statements in the order they were created.

### **Mode 2: Intelligent Weighted Routing** (Default & Preferred)
Dynamic, adaptive ordering that uses machine learning principles to show each user the most valuable statement to vote on next.

---

## 🔄 **How the System Decides Which Mode to Use**

The system makes this decision through a **graceful fallback hierarchy**:

```
1. Check system setting: Is "statement_routing_enabled" = true?
   ├─ YES → Try Weighted Routing
   │   ├─ Call statement-routing Edge Function
   │   ├─ Success? → Use that statement
   │   └─ Error/Failure? → Fall back to Static Mode
   └─ NO → Use Static Mode directly
```

**Current Configuration**: Based on your database, `statement_routing_enabled` is set to `true`, so the system attempts weighted routing by default.

---

## 📊 **Mode 1: Static Sequential Mode**

### **How it Works:**
1. **Initial Order**: Statements are fetched from database ordered by `created_at` (oldest first)
2. **Filtering**: System identifies which statements the user hasn't voted on yet using a vote lookup map
3. **Linear Progression**: User sees the first unvoted statement, then the next, then the next
4. **Skip Logic**: If a user has already voted on statement #3, the system skips it and shows statement #4

### **The Vote Lookup Mechanism:**
- System maintains a `userVotes` object: `{ statement_id: vote_value }`
- To check if statement is unvoted: `!userVotes[statement.statement_id]`
- O(1) lookup time - very efficient

### **When This Mode Activates:**
- Routing is disabled in system settings
- Edge function fails or returns `use_fallback: true`
- No poll ID or participant ID available
- Error occurs during weighted calculation

---

## 🧠 **Mode 2: Intelligent Weighted Routing**

### **Core Philosophy:**
Instead of showing statements in a fixed order, the system **calculates a weight for each unvoted statement** and uses weighted random selection. Statements that are more valuable to the clustering algorithm get higher weights and are more likely to be shown next.

### **The Four Weight Components:**

#### **1. Predictiveness (0.0 - 1.0)**
**What it measures**: How much this statement helps differentiate between opinion groups.

**Calculation**: Variance in support percentages across groups
- High variance (Groups disagree strongly) = High predictiveness = More valuable
- Low variance (All groups agree) = Low predictiveness = Less valuable

**Example**:
- Statement A: Group 1 supports 90%, Group 2 supports 10% → High variance → Weight: 0.8
- Statement B: Group 1 supports 55%, Group 2 supports 50% → Low variance → Weight: 0.1

#### **2. Consensus Potential (0.0 - 1.0)**
**What it measures**: Likelihood that this statement could become a consensus point.

**Calculation**: Ratio of groups that meet consensus criteria
- `min_support_pct` (default 50%): Minimum support needed
- `max_opposition_pct` (default 50%): Maximum opposition allowed

**Example**: If 2 out of 3 groups meet consensus criteria → Weight: 0.67

#### **3. Recency (0.1 - 2.0+)**
**What it measures**: Time-based boost to ensure new statements get visibility.

**Calculation**: 
- **New statements (<24 hours)**: Get full `cold_start_boost` (currently 2.0x)
- **Older statements**: Exponential decay - weight halves every 7 days
- **Minimum**: Never drops below 0.1

**Purpose**: Prevents new user-submitted statements from getting buried behind older ones

#### **4. Pass Rate Penalty (0.1 - 1.0)**
**What it measures**: Penalty for statements that many users mark as "unsure".

**Calculation**: Based on average "unsure" percentage across groups
- 0% unsure → Weight: 1.0 (no penalty)
- 50% unsure → Weight: 0.5
- 100% unsure → Weight: 0.1

**Purpose**: Downweight confusing or ambiguous statements

### **Final Weight Calculation:**
```typescript
combined_weight = predictiveness × consensus_potential × recency × pass_rate_penalty
```

### **Weighted Random Selection:**
Once all weights are calculated:
1. Sum up all weights for unvoted statements
2. Generate random number between 0 and total_weight
3. Iterate through statements, subtracting each weight
4. When random reaches 0 or below, select that statement

**Result**: Higher-weighted statements are more likely to be shown, but lower-weighted ones still have a chance.

---

## 🏗️ **System Architecture**

### **Components Involved:**

#### **1. Frontend: `StatementManager` Class**
**Location**: `src/utils/optimizedStatementUtils.ts`

**Responsibilities**:
- Maintains current state (statements, votes, current index)
- Decides whether to use weighted or static routing
- Calls Edge Function for weighted routing
- Falls back to static mode on errors
- Manages transitions between statements

**Key Methods**:
- `getCurrentTransition()` - Gets current and next statement
- `moveToNext()` - Advances to next statement after vote
- `setRoutingEnabled()` - Toggles between modes

#### **2. Backend: `statement-routing` Edge Function**
**Location**: `supabase/functions/statement-routing/index.ts`

**Responsibilities**:
- Checks if routing is enabled in system settings
- Fetches unvoted statements for participant
- Calculates or retrieves cached weights
- Performs weighted random selection
- Returns selected statement or fallback signal

**Caching Strategy**:
- Weights cached in `polis_statement_weights` table
- Default TTL: 5 minutes (`routing_cache_ttl_minutes`)
- Reduces computation for frequently accessed polls

#### **3. Page Orchestrator: `PollPage.tsx`**
**Location**: `src/pages/PollPage.tsx`

**Responsibilities**:
- Initializes `StatementManager` with poll data
- Enables routing by default: `manager.setRoutingEnabled(true)`
- Handles vote submission
- Updates UI with next statement
- Manages completion flow

---

## 📋 **Complete Flow Example**

### **User Enters Poll:**

1. **Data Loading**:
   - Fetch poll data and all approved statements
   - Fetch user's existing votes
   - Create vote lookup: `{ "stmt-1": "support", "stmt-2": "oppose" }`

2. **Manager Initialization**:
   ```typescript
   const manager = new StatementManager(
     statements,      // All approved statements
     userVotes,       // User's vote history
     poll.poll_id,    // Poll identifier
     participantId    // User/session ID
   );
   manager.setRoutingEnabled(true); // Enable weighted routing
   ```

3. **First Statement Request**:
   - Manager checks: `routingEnabled = true`
   - Calls Edge Function with:
     - `poll_id`: Current poll
     - `participant_id`: User/session
     - `exclude_statement_ids`: ["stmt-1", "stmt-2"]

4. **Edge Function Processing**:
   - Verifies `statement_routing_enabled = true`
   - Fetches unvoted statements (excluding stmt-1, stmt-2)
   - Checks cache for existing weights
   - Calculates weights for uncached statements:
     - **Statement A**: predictive=0.8, consensus=0.6, recency=2.0, penalty=0.9 → **combined=0.864**
     - **Statement B**: predictive=0.3, consensus=0.8, recency=1.0, penalty=1.0 → **combined=0.240**
     - **Statement C**: predictive=0.1, consensus=0.5, recency=0.5, penalty=0.7 → **combined=0.018**
   - Performs weighted random selection (Statement A most likely)
   - Caches weights with 5-minute expiry
   - Returns Statement A

5. **User Votes**:
   - Vote submitted to database
   - Manager updates local vote map: `userVotes["stmt-a"] = "support"`
   - Calls `manager.getCurrentTransition()` again
   - Process repeats for next statement

6. **Completion**:
   - When all statements voted, user transitions to insights/results

---

## 🎛️ **Configuration Settings**

These control the routing behavior:

| Setting Key | Current Value | Purpose |
|------------|---------------|---------|
| `statement_routing_enabled` | `true` | Master switch for weighted routing |
| `routing_cache_ttl_minutes` | `5` | How long to cache weight calculations |
| `routing_cold_start_boost` | `2.0` | Recency multiplier for new statements |
| `min_support_pct` | `50` | Minimum support for consensus (per poll) |
| `max_opposition_pct` | `50` | Maximum opposition for consensus (per poll) |

---

## 💡 **Key Design Decisions**

### **Why Two Modes?**
- **Reliability**: Static mode ensures system never breaks
- **Graceful Degradation**: If Edge Function has issues, voting continues
- **Testing**: Easy to disable and compare approaches

### **Why Weighted Random Instead of Pure Ranking?**
- **Exploration vs Exploitation**: Still shows lower-weighted statements occasionally
- **Diversity**: Different users see different orders, improving data collection
- **Avoids Stagnation**: New statements don't get permanently buried

### **Why Cache Weights?**
- **Performance**: Computing variance across groups is expensive
- **Scalability**: High-traffic polls don't overwhelm the system
- **Freshness**: 5-minute TTL balances performance and accuracy

### **Why These Four Factors?**
Based on Pol.is research and clustering requirements:
- **Predictiveness**: Most critical for creating distinct groups
- **Consensus**: Helps identify shared beliefs faster
- **Recency**: Ensures democratic participation (new ideas get heard)
- **Pass Rate**: Improves data quality by prioritizing clear statements

---

## 🔍 **How This Relates to Your Clustering Issue**

Remember the hightech poll had 115 voters but clustering looked less distinct? The weighted routing system actually **tries to maximize distinctness** by prioritizing predictive statements. However:

1. **Early voters** (first 20-30) mostly saw statements in static order (before enough data for weighting)
2. **Sparse voters** (those who voted on <6 statements) contributed less predictive power
3. **Cold start phase** means initial clustering might not reflect optimal routing

The system learns as more votes come in, improving routing quality over time.




# The intelligent weighted routing **is saved in the database**. Here's how:

## Database Storage

The calculated weights are stored in the **`polis_statement_weights`** table with the following structure:

| Column | Type | Purpose |
|--------|------|---------|
| `weight_id` | UUID | Primary key |
| `statement_id` | UUID | Links to the statement |
| `poll_id` | UUID | Links to the poll |
| `predictiveness` | double precision | How well it differentiates groups (0-1) |
| `consensus_potential` | double precision | Likelihood of consensus (0-1) |
| `recency` | double precision | Time-based boost factor |
| `pass_rate_penalty` | double precision | Penalty for high "unsure" rates |
| `combined_weight` | double precision | Final calculated weight |
| `calculated_at` | timestamp | When it was calculated |
| `expires_at` | timestamp | Cache expiration time (default: 5 minutes) |

## How It Works

1. **First Request**: When a statement weight is needed, the Edge Function calculates all four factors and stores them in `polis_statement_weights`

2. **Caching**: The weights are cached for a configurable TTL (default 5 minutes) to avoid recalculating on every request:
   ```typescript
   // Lines 78-86: Check for cached weights
   const { data: cachedWeights } = await supabaseClient
     .from('polis_statement_weights')
     .select('*')
     .eq('poll_id', poll_id)
     .in('statement_id', unvotedStatements.map(s => s.statement_id))
     .gt('expires_at', new Date().toISOString())
   ```

3. **Upsert**: New weights are inserted or updated using upsert:
   ```typescript
   // Lines 152-154
   await supabaseClient
     .from('polis_statement_weights')
     .upsert(weightsToInsert, { onConflict: 'statement_id,poll_id' })
   ```

4. **Expiration**: Old weights automatically expire and can be cleaned up (there's likely a cleanup function for expired weights)

## Benefits of DB Storage

- **Performance**: Avoids recalculating complex metrics every time
- **Consistency**: All users see the same routing decisions within the cache window
- **Debugging**: You can query the table to see what weights were calculated
- **Auditing**: Historical data shows how statement priorities changed over time

So yes, it's not just calculated on-the-fly—it's persisted and cached in the database for efficiency!