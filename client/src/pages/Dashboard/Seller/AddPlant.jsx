import { Helmet } from 'react-helmet-async'
import AddPlantForm from '../../../components/Form/AddPlantForm'
import { imageUpload } from '../../../api/utils'
import useAuth from '../../../hooks/useAuth'
import { useState } from 'react'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast';

const AddPlant = () => {
  const {user} = useAuth();
  const axiosSecure = useAxiosSecure()
  const [uploadButtonText, setUploadButtonText] = useState('Upload Image')
  const [loading, setLoading] = useState(false)
  const handlePlantSubmit = async e =>{
    e.preventDefault()
    setLoading(true)
    const form = e.target;
    const name = form.name.value;
    const description = form.description.value;
    const category = form.category.value;
    const price = parseFloat(form.price.value)
    const quantity = parseInt(form.quantity.value)
    const image = form.image.files[0]
    const imageUrl = await imageUpload(image)
    //seller info
    const seller = {
      name: user?.displayName,
      image: user?.photoURL,
      email: user?.email
    } 
    const plantData = {
      name,
      description,
      category,
      price,
      quantity,
      image: imageUrl,
      seller
    }

  //Saving data to db
  try{
    //posting data to db
    await axiosSecure.post('/plants', plantData)
    toast.success('Plant Added Successfully!')
  }catch (err) {
    console.log(err)
  }
  finally{
    setLoading(false)
  }
  
  }

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm 
      uploadButtonText={uploadButtonText} 
      handlePlantSubmit={handlePlantSubmit}
      setUploadButtonText={setUploadButtonText}
      loading={loading}
      />
    </div>
  )
}

export default AddPlant
