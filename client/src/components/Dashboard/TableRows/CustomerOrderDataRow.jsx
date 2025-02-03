import PropTypes from 'prop-types'
import { useState } from 'react'
import DeleteModal from '../../Modal/DeleteModal'
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CustomerOrderDataRow = ({orderData, refetch}) => {
  const {image, name, category, price, quantity, status, _id, plantId} = orderData;
  let [isOpen, setIsOpen] = useState(false)
  const closeModal = () => setIsOpen(false)

  //handle Order delete/Cancel

  const handleDelete = async() =>{

    try{
      //fetchind deleting data
      await axios.delete(`${import.meta.env.VITE_API_URL}/orders/${_id}`)
      // increase quantity from plant collection
      await axios.patch(`${import.meta.env.VITE_API_URL}/plant/quantity/${plantId}`,{
        quantityToUpdate: quantity,
        status: 'increase',
      })
      toast.success('Order Cancelled!!')
      refetch()
    }
    catch(err){
      console.log(err)
    }
    finally{
      closeModal();
    }

  }



  return (
    <tr>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='block relative'>
              <img
                alt='profile'
                src={image}
                className='mx-auto object-cover rounded h-10 w-15 '
              />
            </div>
          </div>
        </div>
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{name}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{category}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>${price}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{quantity}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{status}</p>
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <button
          onClick={() => setIsOpen(true)}
          className='relative disabled:cursor-not-allowed cursor-pointer inline-block px-3 py-1 font-semibold text-lime-900 leading-tight'
        >
          <span className='absolute cursor-pointer inset-0 bg-red-200 opacity-50 rounded-full'></span>
          <span className='relative cursor-pointer'>Cancel</span>
        </button>

        <DeleteModal handleDelete={handleDelete} isOpen={isOpen} closeModal={closeModal} />
      </td>
    </tr>
  )
}

CustomerOrderDataRow.propTypes = {
  orderData: PropTypes.object.isRequired,
  order: PropTypes.object,
  refetch: PropTypes.func,
}

export default CustomerOrderDataRow
