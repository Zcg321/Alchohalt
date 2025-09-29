// AUTO-SPLIT BY CODEX
import React from "react";
import TopSection from "./TopSection";
import BehaviorSection from "./BehaviorSection";
import SpendSection from "./SpendSection";
export type StatsProps = { children?: React.ReactNode };
export default function Stats(props: StatsProps){
  return (<div data-testid="Stats-root"><TopSection/><BehaviorSection/><SpendSection/>{props.children}</div>);
}
