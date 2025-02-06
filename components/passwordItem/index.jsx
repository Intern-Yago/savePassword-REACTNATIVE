import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function PasswordItem({data, removePassword}){

    return(
        <Pressable onLongPress={removePassword} style={style.container}>
            <Text style={style.text}>
                {data}
            </Text>
        </Pressable>
    )
}

const style = StyleSheet.create({
    container:{
        backgroundColor: '#0e0e0e',
        padding:14,
        width:'100%',
        marginBottom: 14,
        alignItems:'center',
        justifyContent:"space-between",
        flexDirection:"row",
        borderRadius:8
    },
    text:{
        color:"#fff"
    }
})