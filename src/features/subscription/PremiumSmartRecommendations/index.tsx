// AUTO-SPLIT BY CODEX
import React from "react";
import TopSection from "./TopSection";
import BehaviorSection from "./BehaviorSection";
import SpendSection from "./SpendSection";
export type defaultProps = { children?: React.ReactNode };
export default function default(props: defaultProps){
  return (<div data-testid="PremiumSmartRecommendations-root"><TopSection/><BehaviorSection/><SpendSection/>{props.children}</div>);
}
