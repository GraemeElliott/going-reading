-- Current table structure for reference:
/*
reading_activities (
    id uuid primary key,
    user_id uuid references auth.users not null,
    activity_type text not null,
    book_isbn text,
    metadata jsonb,
    created_at timestamp with time zone
)
*/

-- 1. Pages read in the last 4 weeks by day
-- This query calculates total pages read each day
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

-- 2. Reading progress for a specific book over time
-- Shows how a book was read over time
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

-- 3. Reading velocity (pages per day) for each book
-- Calculates reading speed for completed books
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

-- 4. Monthly reading summary
-- Shows total books started, completed, and pages read per month
WITH monthly_stats AS (
    SELECT 
        date_trunc('month', created_at) as month,
        COUNT(DISTINCT CASE 
            WHEN activity_type = 'BOOK_ADDED' THEN book_isbn 
            END) as books_started,
        COUNT(DISTINCT CASE 
            WHEN activity_type = 'BOOK_STATUS_CHANGED' 
            AND metadata->>'newStatus' = 'read' THEN book_isbn 
            END) as books_completed,
        SUM(CASE 
            WHEN activity_type = 'BOOK_PROGRESS_UPDATED' 
            THEN (metadata->>'currentPage')::int - COALESCE(LAG((metadata->>'currentPage')::int) 
                OVER (PARTITION BY book_isbn ORDER BY created_at), 0)
            ELSE 0 
            END) as pages_read
    FROM reading_activities
    WHERE user_id = '[USER_ID]'
    GROUP BY date_trunc('month', created_at)
)
SELECT 
    month,
    books_started,
    books_completed,
    pages_read
FROM monthly_stats
ORDER BY month DESC;

-- 5. Reading streaks
-- Finds consecutive days of reading
WITH reading_days AS (
    SELECT DISTINCT
        date_trunc('day', created_at) as reading_day
    FROM reading_activities
    WHERE 
        user_id = '[USER_ID]'
        AND activity_type = 'BOOK_PROGRESS_UPDATED'
),
streaks AS (
    SELECT 
        reading_day,
        reading_day - (ROW_NUMBER() OVER (ORDER BY reading_day))::integer * interval '1 day' as streak_group
    FROM reading_days
)
SELECT 
    MIN(reading_day) as streak_start,
    MAX(reading_day) as streak_end,
    COUNT(*) as streak_length
FROM streaks
GROUP BY streak_group
HAVING COUNT(*) > 1
ORDER BY streak_start DESC;

-- Notes on current structure limitations:
-- 1. Extracting data from JSONB requires type casting
-- 2. Progress calculations need self-joins or window functions
-- 3. Can't easily validate data (e.g., currentPage <= totalPages)
-- 4. More complex queries might impact performance
