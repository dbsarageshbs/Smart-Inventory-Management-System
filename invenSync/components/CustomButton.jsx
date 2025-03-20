import { Text, TouchableOpacity } from 'react-native'
import React from 'react'

const CustomButton = ({text,handlePress,containerStyles,textStyles,isLoading}) => {
  return (
    <TouchableOpacity disabled={isLoading} activeOpacity={0.7} onPress={handlePress}
            className={`bg-green-50 rounded-xl min-h-[62px] items-center justify-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}>
        <Text className={`text-primary font-psemibold text-xl text-center ${textStyles}`}>{text}</Text>
    </TouchableOpacity>
  )
}

export default CustomButton