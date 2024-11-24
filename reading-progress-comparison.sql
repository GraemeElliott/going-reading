-- Proposed reading_progress table structure:
/*
reading_progress (
    id uuid primary key,
    user_id uuid references auth.users not null,
    book_isbn text not null,
    pages_read integer not null,
    total_pages integer not null,
    recorded_at timestamp with time zone
)
*/

-- Compare the queries:

-- 1. Pages read in the last 4 weeks by day
-- Current structure (complex):
SELECT 
    date_trunc('day', created_at) as day,
    SUM(
        (metadata->>'currentPage')::int - 
        COALESCE(LAG((metadata->>'currentPage')::int) OVER (PARTITION BY book_isbn ORDER BY created_at), 0)
    ) as pages_read
FROM reading_activities
WHERE 
    user_id = '[USER_ID]'
    AND activity_type = 'BOOK_PROGRESS_UPDATED'
    AND created_at >= now() - interval '4 weeks'
GROUP BY date_trunc('day', created_at)
ORDER BY day;

-- With dedicated table (simpler):
SELECT 
    date_trunc('day', recorded_at) as day,
    SUM(pages_read - LAG(pages_read) OVER (PARTITION BY book_isbn ORDER BY recorded_at)) as pages_read
FROM reading_progress
WHERE 
    user_id = '[USER_ID]'
    AND recorded_at >= now() - interval '4 weeks'
GROUP BY date_trunc('day', recorded_at)
ORDER BY day;

-- 2. Reading progress for a specific book
-- Current structure (complex):
SELECT 
    created_at,
    book_isbn,
    (metadata->>'currentPage')::int as pages_read,
    (metadata->>'totalPages')::int as total_pages,
    ((metadata->>'currentPage')::float / (metadata->>'totalPages')::float * 100) as progress_percentage
FROM reading_activities
WHERE 
    user_id = '[USER_ID]'
    AND book_isbn = '[BOOK_ISBN]'
    AND activity_type = 'BOOK_PROGRESS_UPDATED'
ORDER BY created_at;

-- With dedicated table (simpler):
SELECT 
    recorded_at,
    book_isbn,
    pages_read,
    total_pages,
    (pages_read::float / total_pages * 100) as progress_percentage
FROM reading_progress
WHERE 
    user_id = '[USER_ID]'
    AND book_isbn = '[BOOK_ISBN]'
ORDER BY recorded_at;

-- 3. Reading velocity (pages per day)
-- Current structure (complex):
WITH book_progress AS (
    SELECT 
        book_isbn,
        MIN(created_at) as start_date,
        MAX(created_at) as end_date,
        MAX((metadata->>'currentPage')::int) - MIN((metadata->>'currentPage')::int) as total_pages_read
    FROM reading_activities
    WHERE 
        user_id = '[USER_ID]'
        AND activity_type = 'BOOK_PROGRESS_UPDATED'
    GROUP BY book_isbn
)
SELECT 
    book_isbn,
    total_pages_read,
    EXTRACT(epoch FROM (end_date - start_date)) / 86400 as days_reading,
    ROUND(total_pages_read / (EXTRACT(epoch FROM (end_date - start_date)) / 86400), 2) as pages_per_day
FROM book_progress
WHERE total_pages_read > 0;

-- With dedicated table (simpler):
SELECT 
    book_isbn,
    MAX(pages_read) - MIN(pages_read) as total_pages_read,
    EXTRACT(epoch FROM (MAX(recorded_at) - MIN(recorded_at))) / 86400 as days_reading,
    ROUND(
        (MAX(pages_read) - MIN(pages_read)) / 
        (EXTRACT(epoch FROM (MAX(recorded_at) - MIN(recorded_at))) / 86400),
        2
    ) as pages_per_day
FROM reading_progress
WHERE user_id = '[USER_ID]'
GROUP BY book_isbn
HAVING MAX(pages_read) - MIN(pages_read) > 0;

Key Benefits of Dedicated Table:
1. No type casting needed (metadata->>'currentPage')::int
2. Better data validation (pages_read can have constraints)
3. Simpler queries (no need to filter activity_type)
4. Better performance (indexed integer columns vs JSONB)
5. Easier to maintain and extend

Key Benefits of Current Structure:
1. Single table for all activities
2. More flexible for adding new types of metadata
3. Simpler to maintain (one table)
4. Good for activity feed use case

The choice depends on your priorities:
- If analytics and data validation are important: Use dedicated table
- If flexibility and simplicity are more important: Keep current structure
