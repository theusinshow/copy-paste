from pydantic import BaseModel, ConfigDict


class ReviewDecisionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    issue_id: int
    decision: str
    comment: str
