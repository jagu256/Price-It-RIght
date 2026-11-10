import { createContext, useContext } from 'react';

/**
 * Every section stays mounted (so typed inputs are never lost), but only one is
 * shown. Charts hold no inputs, so hidden sections skip drawing them – this
 * keeps typing fast when many charts exist.
 */
export const SectionVisibleContext = createContext(true);

/** True when the section this component belongs to is on screen (true outside sections). */
export const useSectionVisible = () => useContext(SectionVisibleContext);
