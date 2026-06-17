"use strict";
import { ListGroup } from "react-bootstrap";

const segKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export default function SegmentList({ segments, stationsById, usedKeys, onPick }) {
    return (
        <ListGroup style={{ maxHeight: 480, overflowY: "auto" }}>
            {segments.map((seg, i) => {
                const used = usedKeys?.has(segKey(seg.from, seg.to)); // each segment may be picked only once
                return (
                    <ListGroup.Item action key={i} disabled={used}
                        onClick={() => { if (!used) onPick(seg); }}>
                        {stationsById[seg.from].name} - {stationsById[seg.to].name}
                    </ListGroup.Item>
                );
            })}
        </ListGroup>
    );
}
