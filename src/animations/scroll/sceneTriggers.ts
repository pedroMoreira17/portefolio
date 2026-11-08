import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState, type SceneState } from '../../components/particle-engine/sceneState';

type ProgressKey = keyof Pick<
  SceneState,
  'heroToExpertise' | 'expertiseToJourney' | 'journeyToProjects' | 'projectsToContact' | 'journeyProgress'
>;

/**
 * Narrative ScrollTriggers. They only *report* progress into the shared scene
 * state; the particle engine derives and damps its uniforms from it. This keeps
 * forward and backward scrolling perfectly symmetrical (no competing tweens).
 */
export function createSceneTriggers() {
  const triggers: ScrollTrigger[] = [];
  const track = (key: ProgressKey, vars: ScrollTrigger.Vars) => {
    triggers.push(
      ScrollTrigger.create({
        ...vars,
        onUpdate: (self) => {
          sceneState[key] = self.progress;
        },
        onRefresh: (self) => {
          sceneState[key] = self.progress;
        },
      }),
    );
  };

  track('heroToExpertise', { trigger: '#expertise', start: 'top 78%', end: 'top 0%' });
  track('expertiseToJourney', { trigger: '#journey', start: 'top 90%', end: 'top 20%' });
  track('journeyProgress', { trigger: '#journey', start: 'top bottom', end: 'bottom top' });
  track('journeyToProjects', { trigger: '#projects', start: 'top 90%', end: 'top 15%' });
  track('projectsToContact', { trigger: '#contact', start: 'top 95%', end: 'top 10%' });

  return () => triggers.forEach((t) => t.kill());
}
