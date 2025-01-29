import { Helmet } from 'react-helmet-async'
import AddPlantForm from '../../../components/Form/AddPlantForm'
import { imageUpload } from '../../../api/utils'
import useAuth from '../../../hooks/useAuth'

const AddPlant = () => {
  const {user} = useAuth()
  const handlePlantSubmit = async e =>{
    e.preventDefault()
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
  }
  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm handlePlantSubmit={handlePlantSubmit}/>
    </div>
  )
}

export default AddPlant
