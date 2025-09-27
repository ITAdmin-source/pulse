-- Migration: Add triggers to cleanup anonymous users when they have no votes or statements
-- This ensures anonymous users are deleted when their last vote is removed
-- and they haven't submitted any statements

-- Function to check and delete anonymous user if they have no votes or statements
CREATE OR REPLACE FUNCTION cleanup_anonymous_user_if_empty()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check anonymous users (those with session_id and no clerk_user_id)
    IF OLD.user_id IS NOT NULL THEN
        -- Check if the user is anonymous
        DECLARE
            user_record RECORD;
            vote_count INTEGER;
            statement_count INTEGER;
        BEGIN
            -- Get user info
            SELECT session_id, clerk_user_id INTO user_record
            FROM users
            WHERE id = OLD.user_id;

            -- Only proceed if user is anonymous (has session_id, no clerk_user_id)
            IF user_record.session_id IS NOT NULL AND user_record.clerk_user_id IS NULL THEN
                -- Count remaining votes for this user
                SELECT COUNT(*) INTO vote_count
                FROM votes
                WHERE user_id = OLD.user_id;

                -- Count statements submitted by this user
                SELECT COUNT(*) INTO statement_count
                FROM statements
                WHERE submitted_by = OLD.user_id;

                -- If no votes and no statements, delete the anonymous user
                IF vote_count = 0 AND statement_count = 0 THEN
                    DELETE FROM users WHERE id = OLD.user_id;
                    RAISE NOTICE 'Deleted anonymous user % (no votes or statements remaining)', OLD.user_id;
                END IF;
            END IF;
        END;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to check and delete anonymous user when statement is deleted
CREATE OR REPLACE FUNCTION cleanup_anonymous_user_on_statement_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if statement was submitted by someone
    IF OLD.submitted_by IS NOT NULL THEN
        -- Check if the user is anonymous
        DECLARE
            user_record RECORD;
            vote_count INTEGER;
            statement_count INTEGER;
        BEGIN
            -- Get user info
            SELECT session_id, clerk_user_id INTO user_record
            FROM users
            WHERE id = OLD.submitted_by;

            -- Only proceed if user is anonymous (has session_id, no clerk_user_id)
            IF user_record.session_id IS NOT NULL AND user_record.clerk_user_id IS NULL THEN
                -- Count remaining votes for this user
                SELECT COUNT(*) INTO vote_count
                FROM votes
                WHERE user_id = OLD.submitted_by;

                -- Count remaining statements submitted by this user
                SELECT COUNT(*) INTO statement_count
                FROM statements
                WHERE submitted_by = OLD.submitted_by;

                -- If no votes and no statements, delete the anonymous user
                IF vote_count = 0 AND statement_count = 0 THEN
                    DELETE FROM users WHERE id = OLD.submitted_by;
                    RAISE NOTICE 'Deleted anonymous user % (no votes or statements remaining)', OLD.submitted_by;
                END IF;
            END IF;
        END;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on votes table to cleanup anonymous users when votes are deleted
DROP TRIGGER IF EXISTS cleanup_anonymous_user_after_vote_delete ON votes;
CREATE TRIGGER cleanup_anonymous_user_after_vote_delete
    AFTER DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_anonymous_user_if_empty();

-- Create trigger on statements table to cleanup anonymous users when statements are deleted
DROP TRIGGER IF EXISTS cleanup_anonymous_user_after_statement_delete ON statements;
CREATE TRIGGER cleanup_anonymous_user_after_statement_delete
    AFTER DELETE ON statements
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_anonymous_user_on_statement_delete();