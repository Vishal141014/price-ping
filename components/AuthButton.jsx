'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { LogIn, LogOut } from 'lucide-react'
import { AuthModel } from './AuthModel'
import { signOut } from '@/app/actions'

const AuthButton = ({ user }) => {

const [showAuthModel, setShowAuthModel] = useState(false);

if(user){
    return(
        <form action={signOut}>
            <Button variant='ghost' size='sm' type='submit' className="gap-2">
                <LogOut className='w-4 h-4'/>
                Sign Out
            </Button>
        </form>
    );
}

  return (
    <>
        <Button
            onClick={() => setShowAuthModel(true)}
            variant="default"
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>

          <AuthModel 
          isOpen={showAuthModel}
          onClose={() => setShowAuthModel(false)}
          />
    </>
  )
}

export default AuthButton