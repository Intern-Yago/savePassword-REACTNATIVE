import { ModalPassword } from '@/components/modal';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Modal} from 'react-native';

let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZ0123456789!@#$%&*"
let symbols = "!@#$%&*"

export default function Home() {

  const initialSize = 12
  const [size, setSize] = useState(initialSize)
  const [passwordValue, setPasswordValue] = useState("")
  const [modalVisible, setModalVisible] = useState(false)

  function generatePassword(){
    let password = ""

    for(let i=0, n=charset.length; i<size-1; i++){
      password+=charset.charAt(Math.floor(Math.random()*n))
    }
    password += symbols.charAt(Math.floor(Math.random()*symbols.length))
    
    setPasswordValue(password)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
        <Image 
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
                />

        <Text style={styles.title}>
          {size.toString()} caracteres
        </Text>
        <View style={styles.area}>
          <Slider
            style={{height: 50}}
            minimumValue={6}
            maximumValue={20}
            maximumTrackTintColor='#ff0000'
            minimumTrackTintColor='#392de9'
            thumbTintColor='#392de9'
            value={initialSize}
            onValueChange={(value)=>{
                let valor = value.toFixed()
                setSize(parseInt(valor))
                
              }}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={generatePassword}>
          <Text style={styles.buttonText}>
            Gerar senha
          </Text>
        </TouchableOpacity>
        <Modal visible={modalVisible} animationType='fade' transparent={true}>
          <ModalPassword password={passwordValue} handleClose={()=>setModalVisible(false)}/>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#F3F3FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo:{
    marginBottom:60,
  },
  title:{
    fontSize: 30,
    fontWeight: 'bold'
  },
  area:{
    marginTop: 14,
    marginBottom:14,
    width: "80%",
    backgroundColor: '#FFF',
    borderRadius:8,
    padding:8,
  },
  button:{
    backgroundColor:'#392de9',
    width: '80%',
    height:50,
    alignItems:'center',
    justifyContent:'center',
    borderRadius: 8,
    marginBottom: 18
  },
  buttonText:{
    color: "#fff",
    fontSize: 20,

  }

})
