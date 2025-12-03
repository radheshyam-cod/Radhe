def calculate_mastery_score(
    is_correct: bool, 
    solving_time: int | None, 
    confidence: float | None
) -> float:
    """
    Calculates a mastery score based on correctness, time, and confidence.
    """
    base_score = 80.0 if is_correct else 20.0

    if confidence is not None:
        base_score += (confidence - 0.5) * 20.0

    if solving_time is not None:
        if solving_time > 30 and is_correct:
            base_score -= 10.0
        elif solving_time < 10 and is_correct:
            base_score += 5.0

    return max(0.0, min(100.0, base_score))
