import { ExecutiveInsight } from "./executiveBrain";
import { ProjectGraph } from "../types/project";
import { getStrongModules, getWeakModules } from "../core/projectEngine";
import { ExecutiveDecision } from "../types/executive";

export interface ProducerDecision {

    executive: ExecutiveDecision;

    understood: string;

    organized: string[];

    gaps: string[];

    nextQuestion: string;

}

export function buildProducerDecision(

    graph: ProjectGraph,

    insight: ExecutiveInsight

): ProducerDecision {

    const executive: ExecutiveDecision = {

        mode: "ask",

        explanation: insight.summary,

        confidence: 90,

        question: insight.nextBestAction,

        nextModule: insight.recommendedModule

    };

    return {

        executive,

        understood:

            `Perfecto. Ya integré esta información al proyecto. ${insight.summary}`,

        organized:

            getStrongModules(graph,5).map(m=>m.title),

        gaps:

            getWeakModules(graph,4).map(m=>m.title),

        nextQuestion:

            insight.nextBestAction

    };

}