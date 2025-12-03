from datetime import datetime, timedelta

class SM2:
    def __init__(self, ease_factor=2.5, interval=0, repetitions=0, scheduled_date=None):
        self.ease_factor = ease_factor
        self.interval = interval
        self.repetitions = repetitions
        self.scheduled_date = scheduled_date or datetime.utcnow()

    def schedule_first_review(self):
        self.interval = 1
        self.repetitions = 1
        self.scheduled_date = datetime.utcnow() + timedelta(days=1)

    def review(self, quality: int):
        """
        Update the SM2 state based on the quality of a review.
        Quality should be an integer from 0 to 5.
        """
        if quality < 3:
            self.repetitions = 0
            self.interval = 1
        else:
            self.ease_factor = max(1.3, self.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = round(self.interval * self.ease_factor)
            self.repetitions += 1

        self.scheduled_date = datetime.utcnow() + timedelta(days=self.interval)

    def to_dict(self):
        return {
            "ease_factor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "scheduled_date": self.scheduled_date
        }

    @classmethod
    def from_dict(cls, data):
        return cls(**data)
