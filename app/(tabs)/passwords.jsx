import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useStorage from '../../hooks/useStorage'
import PasswordItem from "../../components/passwordItem";

export default function Passwords(){
  const [listPasswords, setListPasswords] = useState([])
  const focused = useIsFocused()
  const {getItem, removeItem} = useStorage()

  async function handleDeletePassword(item){
    const passwords = await removeItem("@pass", item)  
    setListPasswords(passwords)
  }

  useEffect(()=>{
    async function loadPasswords(){
      const passwords = await getItem("@pass")
      setListPasswords(passwords)
      
    } 
    loadPasswords() 
  }, [focused])

  return(
    <SafeAreaView style={{flex:1,backgroundColor:'#F3F3FF',
    }}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Minhas senhas
        </Text>
      </View>
      <View style={styles.content}>
        <FlatList
          style={{flex:1, paddingTop:14}}
          data={listPasswords}
          keyExtractor={(item)=>{String(item)}}
          renderItem={({item})=> <PasswordItem data={item} removePassword={()=>handleDeletePassword(item)}/>}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:{
    backgroundColor:"#392de3",
    paddingTop:58,
    paddingLeft: 14,
    paddingBottom: 14,
    paddingRight: 14
  },
  title:{
    color:"#fff",
    fontWeight:"bold",
    fontSize:18
  },
  content:{
    flex:1,
    paddingLeft: 14,
    paddingRight:14
  }
})