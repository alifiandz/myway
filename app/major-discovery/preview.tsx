'use client';
import {useState} from 'react';
import {GuestExplore} from '../page';
import {AuthModal} from '../auth-modal';

export default function MajorDiscoveryPreview({mode}:{mode:'explorer'|'match'}) {
  const [authOpen,setAuthOpen]=useState(false);
  return <><GuestExplore language="en" initialDiscovery={mode} openAccount={()=>setAuthOpen(true)}/>{authOpen && <AuthModal session={null} recovery={false} language="en" close={()=>setAuthOpen(false)} openProfile={()=>setAuthOpen(false)}/>}</>;
}
