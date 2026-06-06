"use strict";
import { ListGroup } from "react-bootstrap";

export default function SegmentList({ segments, stationsById, onPick }) {
    return (
        <ListGroup style={{ maxHeight: 480, overflowY: "auto" }}>
            {segments.map((seg, i) => (
                <ListGroup.Item action key={i} onClick={() => onPick(seg)}>
                    {stationsById[seg.from].name} — {stationsById[seg.to].name}
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
}
